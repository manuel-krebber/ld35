(function () {
  var tileSize = 32
  var personRadius = 12 / 2

  var topBarHeight = 50
  var topBarBackground = 0x666666
  var topBarColor = 0xFFFFFF
  var iconFadeTime = 1500
  var idleTime = 2000

  var renderWidth = 1200
  var renderHeight = 750

  var gridColor = 0x666666
  var gridAlpha = 0.6

  var Game = window.game = {
    currentLevel: 0
  }

  var targets = ['kitchen', 'bath', 'toilet', 'gym', 'living', 'sleeping']

  PIXI.loader.add('corridor-straight', 'images/straight.png')
  PIXI.loader.add('arrow', 'images/arrow.png')

  PIXI.loader.once('complete', onAssetsLoaded)

  var levels = [
    {
      name: 'Tutorial #1',
      generator: staticLevelGenerator(-1, 3, 10, [
        'XX5XXXXXX',
        'XP.....5X',
        'XXXXXXXXX'
      ]),
      nextLevel: 1
    },
    {
      name: 'Tutorial #2',
      generator: staticLevelGenerator(20, 3, 10, [
        'XXXXXXXXXXXXXXXXXXXXX',
        'XXXXXX...XXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXXXXXXX',
        'XX5XXXXXXXXXXXXXXXXXX',
        'XP....XXX..........5X',
        'XXXXXXXXXXXXXXXXXXXXX'
      ]),
      nextLevel: 2
    },
    {
      name: 'Tutorial #3',
      generator: staticLevelGenerator(30, 3, 10, [
        'XX1XXXXXXXXXXXXXXXXXX',
        'XPXXXX...XXXXXX....1X',
        'X.XXXXXXXXXXXXXXXXXXX',
        'X.XXXXXXXXXXXXXXXXXXX',
        'X.....XXX......XXXXXX',
        'XXXXXXXXXXXXXXXXXXXXX'
      ]),
      nextLevel: 3
    },
    {
      name: 'Tutorial #4',
      generator: staticLevelGenerator(60, 3, 10, [
        'XX2XXXXXXXXXXXXXXXXXX',
        'XPXXXX...XXXXXX....1X',
        'X.XXXXXXXXXXXXXXXXXXX',
        'X.XXXXXXXXXXXXXXXXXXX',
        'X.....XXXX.XX.XXXXXXX',
        'X.XXXXXXXXXXXXXXXXXXX',
        'X.XXXXX.XXXXXXXXXXXXX',
        'X.XXXX...XXXXXX.2.XXX',
        'X.XXXXXXXXXXXXXXXXXXX',
        'X.XXXXXXXXX1XXXXXXXXX',
        'X.....XXX.P....XXXXXX',
        'XXXXXXXXXXXXXXXXXXXXX'
      ])
    },
    {
      name: 'Small Random',
      generator: randomLevelGenerator(6, 4, 3, 2, 1, 100, true, 60)
    },
    {
      name: 'Medium Random',
      generator: randomLevelGenerator(10, 6, 3, 4, 3, 150, true, 160)
    },
    {
      name: 'Big Random',
      generator: randomLevelGenerator(18, 10, 2, 6, 6, 250, true, 300)
    }
  ]

  var bubbleTexture = PIXI.Texture.fromImage('images/bubble.png', true, PIXI.SCALE_MODES.NEAREST)
  var moodGoodTexture = PIXI.Texture.fromImage('images/mood-good.png', true, PIXI.SCALE_MODES.NEAREST)
  var moodBadTexture = PIXI.Texture.fromImage('images/mood-bad.png', true, PIXI.SCALE_MODES.NEAREST)
  var moodNeutralTexture = PIXI.Texture.fromImage('images/mood-neutral.png', true, PIXI.SCALE_MODES.NEAREST)

  var btnRestartTexture = PIXI.Texture.fromImage('images/button-restart.png', true, PIXI.SCALE_MODES.NEAREST)
  var btnNextLevelTexture = PIXI.Texture.fromImage('images/button-next-level.png', true, PIXI.SCALE_MODES.NEAREST)

  var timeIconTexture = PIXI.Texture.fromImage('images/icon-time.png', true, PIXI.SCALE_MODES.NEAREST)

  var personTextures = [
    PIXI.Texture.fromImage('images/person.png', true, PIXI.SCALE_MODES.NEAREST),
    PIXI.Texture.fromImage('images/person-anim-1.png', true, PIXI.SCALE_MODES.NEAREST),
    PIXI.Texture.fromImage('images/person.png', true, PIXI.SCALE_MODES.NEAREST),
    PIXI.Texture.fromImage('images/person-anim-2.png', true, PIXI.SCALE_MODES.NEAREST)
  ]

  var corridorTextures = {
    'straight': PIXI.Texture.fromImage('images/straight.png', true, PIXI.SCALE_MODES.NEAREST),
    'block': PIXI.Texture.fromImage('images/block.png', true, PIXI.SCALE_MODES.NEAREST),
    'tee': PIXI.Texture.fromImage('images/tee.png', true, PIXI.SCALE_MODES.NEAREST),
    'dead': PIXI.Texture.fromImage('images/dead-end.png', true, PIXI.SCALE_MODES.NEAREST),
    'cross': PIXI.Texture.fromImage('images/cross.png', true, PIXI.SCALE_MODES.NEAREST),
    'angle': PIXI.Texture.fromImage('images/angle.png', true, PIXI.SCALE_MODES.NEAREST)
  }

  var roomTextures = {
    'straight': PIXI.Texture.fromImage('images/room-straight.png', true, PIXI.SCALE_MODES.NEAREST),
    'tee': PIXI.Texture.fromImage('images/room-tee.png', true, PIXI.SCALE_MODES.NEAREST),
    'dead': PIXI.Texture.fromImage('images/room-single.png', true, PIXI.SCALE_MODES.NEAREST),
    'cross': PIXI.Texture.fromImage('images/room-cross.png', true, PIXI.SCALE_MODES.NEAREST),
    'angle': PIXI.Texture.fromImage('images/room-angle.png', true, PIXI.SCALE_MODES.NEAREST)
  }

  var iconTextures = {
    'kitchen': PIXI.Texture.fromImage('images/icon-kitchen.png', true, PIXI.SCALE_MODES.NEAREST),
    'sleeping': PIXI.Texture.fromImage('images/icon-bed.png', true, PIXI.SCALE_MODES.NEAREST),
    'bath': PIXI.Texture.fromImage('images/icon-bath.png', true, PIXI.SCALE_MODES.NEAREST),
    'toilet': PIXI.Texture.fromImage('images/icon-toilet.png', true, PIXI.SCALE_MODES.NEAREST),
    'gym': PIXI.Texture.fromImage('images/icon-gym.png', true, PIXI.SCALE_MODES.NEAREST),
    'living': PIXI.Texture.fromImage('images/icon-living.png', true, PIXI.SCALE_MODES.NEAREST)
  }

  var floorTexture = PIXI.Texture.fromImage('images/floor.png', true, PIXI.SCALE_MODES.NEAREST)
  var arrowTexture = PIXI.Texture.fromImage('images/arrow.png', true, PIXI.SCALE_MODES.NEAREST)

  var desaturateFilter = new PIXI.filters.ColorMatrixFilter()
  desaturateFilter.desaturate()

  var renderer = PIXI.autoDetectRenderer(renderWidth, renderHeight,
    {
      backgroundColor: 0x000000
    }
  )
  document.getElementById('gameView').appendChild(renderer.view)

  var deg180 = Math.PI
  var deg45 = Math.PI / 2
  var stage = new PIXI.Container()

  function getMoodTexture (mood, max) {
    var offset = mood * 3.0 / max
    return offset >= 2 ? moodGoodTexture : offset <= 1 ? moodBadTexture : moodNeutralTexture
  }

  function createGrid (w, h, size, color) {
    var grid = new PIXI.Graphics()

    for (var x = 1; x < w; x++) {
      grid.beginFill(color)
      grid.drawRect(x * size - 1, 0, 2, h * size)
      grid.endFill()
    }

    for (var y = 1; y < h; y++) {
      grid.beginFill(color)
      grid.drawRect(0, y * size - 1, w * size, 2)
      grid.endFill()
    }

    return grid
  }

  function locationImage (scale, top, left, right, bottom, room) {
    var texture
    var rotation = 0

    if (top && bottom && left && right) {
      texture = 'cross'
    } else if (!top && !bottom && !left && !right) {
      texture = 'block'
    } else if (top && bottom && !left && !right) {
      texture = 'straight'
    } else if (!top && !bottom && left && right) {
      texture = 'straight'
      rotation = deg45
    // Dead End
    } else if (!top && bottom && !left && !right) {
      texture = 'dead'
    } else if (!top && !bottom && left && !right) {
      texture = 'dead'
      rotation = deg45
    } else if (!top && !bottom && !left && right) {
      texture = 'dead'
      rotation = -deg45
    } else if (top && !bottom && !left && !right) {
      texture = 'dead'
      rotation = deg180
    // Angle
    } else if (!top && bottom && left && !right) {
      texture = 'angle'
    } else if (!top && bottom && !left && right) {
      texture = 'angle'
      rotation = -deg45
    } else if (top && !bottom && left && !right) {
      texture = 'angle'
      rotation = deg45
    } else if (top && !bottom && !left && right) {
      texture = 'angle'
      rotation = deg180
    // Tee-Junction
    } else if (!top && bottom && left && right) {
      texture = 'tee'
    } else if (top && !bottom && left && right) {
      texture = 'tee'
      rotation = deg180
    } else if (top && bottom && !left && right) {
      texture = 'tee'
      rotation = -deg45
    } else if (top && bottom && left && !right) {
      texture = 'tee'
      rotation = deg45
    }

    var sprite = new PIXI.Sprite(room ? roomTextures[texture] : corridorTextures[texture])
    sprite.pivot.set(0, 0)
    sprite.anchor.set(0.5, 0.5)
    sprite.rotation = rotation

    if (room) {
      var icon = new PIXI.Sprite(iconTextures[room])
      icon.anchor.set(0.5, 0.5)
      var container = new PIXI.Container()

      container.addChild(sprite)
      container.addChild(icon)

      sprite = container
    }

    sprite.scale.set(scale, scale)

    return sprite
  }

  function isLocationFree (location) {
    if (location.info.person) return false
    if (location.info.top) return true
    if (location.info.bottom) return true
    if (location.info.left) return true
    if (location.info.right) return true
    return false
  }

  function fade (obj, alpha, duration) {
    if (typeof duration !== 'number') {
      duration = 500
    }
    return createjs.Tween.get(obj)
      .to({ alpha: alpha, visible: alpha !== 0 }, duration)
  }

  function fadeOut (obj, duration) {
    return fade(obj, 0, duration)
  }

  function fadeIn (obj, duration) {
    obj.visible = true
    return fade(obj, 1, duration)
  }

  function createPerson (house, x, y, target) {
    var personAnim = new PIXI.extras.MovieClip(personTextures)

    personAnim.scale.set(house.scale, house.scale)
    personAnim.animationSpeed = 0.06
    personAnim.anchor.set(0.5, 0.5)
    personAnim.interactive = true

    var location = location = house.locations[x][y]

    var bubble = new PIXI.Sprite(bubbleTexture)
    bubble.anchor.set(0, 1.1)
    bubble.scale.set(house.scale, house.scale)

    var targetIcon = new PIXI.Sprite(iconTextures[target])
    targetIcon.anchor.set(-0.3, 1.6)
    targetIcon.scale.set(house.scale, house.scale)

    var moodIcon = new PIXI.Sprite(moodGoodTexture)
    moodIcon.anchor.set(1, 1.6)
    moodIcon.scale.set(2, 2)
    moodIcon.alpha = 0

    var container = new PIXI.Container()
    var overlayContainer = new PIXI.Container()

    container.position.set(house.getLocationX(x), house.getLocationY(y))
    overlayContainer.position = container.position

    container.addChild(personAnim)

    overlayContainer.addChild(bubble)
    overlayContainer.addChild(targetIcon)
    overlayContainer.addChild(moodIcon)

    house.rowBlocked[y]++
    house.colBlocked[x]++

    var person = {
      animation: personAnim,
      container: container,
      overlayContainer: overlayContainer,
      target: target,
      location: location,
      targetIcon: targetIcon,
      moodIcon: moodIcon,
      bubble: bubble,
      x: x,
      y: y,
      dx: 0,
      dy: 0
    }

    personAnim.on('mouseover', function () {
      moodIcon.alpha = 0
      fadeIn(person.moodIcon)
      if (person.iconTimeout) {
        window.clearTimeout(person.iconTimeout)
        person.iconTimeout = null
      }
    })
    personAnim.on('mouseout', function () {
      person.iconTimeout = window.setTimeout(function () {
        fadeOut(person.moodIcon)
        person.iconTimeout = null
      }, iconFadeTime)
    })

    location.info.person = person

    return person
  }

  function rotateToAngle (current, target, step) {
    if (Math.abs(current - target) < step) return target
    var negative = (target - current + 360) % 360 > 180
    return current + (negative ? -step : step)
  }

  function findTargetPositions (house) {
    var targets = []
    for (var x = 0; x < house.width; x++) {
      for (var y = 0; y < house.height; y++) {
        if (house.locations[x][y].info.target) {
          targets.push({
            x: x,
            y: y,
            target: house.locations[x][y].info.target
          })
        }
      }
    }

    return targets
  }

  function makePath (paths, x, y) {
    var path = []
    var pred = paths[x][y]

    while (pred) {
      path.push({
        dx: -pred.dx,
        dy: -pred.dy
      })
      x += pred.dx
      y += pred.dy
      pred = paths[x][y]
    }

    return path.reverse()
  }

  function formatPaths (paths) {
    var str = ''
    for (var y = 0; y < paths[0].length; y++) {
      for (var x = 0; x < paths.length; x++) {
        str += paths[x][y] ? 'X' : '.'
      }
      str += '\n'
    }
    return str
  }

  function refreshPathForPerson (house, person) {
    checkCollisionForPerson(house, person)

    if (!person.target) return

    var paths = findPaths(house, {x: person.x + person.dx, y: person.y + person.dy})
    var targets = findTargetPositions(house)
    var path = null

    for (var i = 0; i < targets.length; i++) {
      if (targets[i].target === person.target) {
        if (paths[targets[i].x][targets[i].y]) {
          var newPath = makePath(paths, targets[i].x, targets[i].y)
          if (!path || newPath.length < path.length) {
            path = newPath
          }
        }
      }
    }

    person.path = path
  }

  function checkCollisionForPerson (house, person) {
    if (!house.canMove(person.x, person.y, person.dx, person.dy)) {
      if (person.container.position.x !== house.getLocationX(person.x) ||
          person.container.position.y !== house.getLocationY(person.y)) {
        person.x += person.dx
        person.dx = -person.dx
        person.y += person.dy
        person.dy = -person.dy
      } else {
        person.dx = person.dy = 0
      }
    }
  }

  function getPossibleDirectionsForPerson (house, person) {
    var possibilities = []
    if (house.canMove(person.x, person.y, -1, 0)) {
      possibilities.push({dx: -1, dy: 0})
    }
    if (house.canMove(person.x, person.y, 1, 0)) {
      possibilities.push({dx: 1, dy: 0})
    }
    if (house.canMove(person.x, person.y, 0, -1)) {
      possibilities.push({dx: 0, dy: -1})
    }
    if (house.canMove(person.x, person.y, 0, 1)) {
      possibilities.push({dx: 0, dy: 1})
    }

    return possibilities
  }

  function changePersonMood (person, newMood) {
    if (person.mood !== newMood) {
      person.moodIcon.texture = getMoodTexture(newMood, 2)

      if (!person.iconTimeout) {
        fadeIn(person.moodIcon)
        person.iconTimeout = window.setTimeout(function () {
          fadeOut(person.moodIcon)
          person.iconTimeout = null
        }, iconFadeTime + 500)
      }
    }
    person.mood = newMood
  }

  function createLevelEndScreen () {
    var endScreen = { shown: false }
    var container = endScreen.container = new PIXI.Container()
    container.visible = false

    var title = endScreen.title = new PIXI.Text('Title', {
      font: 'bold 100px monospace',
      fill: 0xFFFFFF
    })
    title.anchor.set(0.5, 2)
    title.position.set(renderWidth / 2, renderHeight / 2)
    container.addChild(title)

    var restartButton = endScreen.restartButton = new PIXI.Sprite(btnRestartTexture)
    restartButton.anchor.set(1.3, -2)
    restartButton.position.set(renderWidth / 2, renderHeight / 2)
    restartButton.interactive = true
    container.addChild(restartButton)

    var nextButton = endScreen.nextButton = new PIXI.Sprite(btnNextLevelTexture)
    nextButton.anchor.set(-0.3, -2)
    nextButton.position.set(renderWidth / 2, renderHeight / 2)
    nextButton.interactive = true
    container.addChild(nextButton)

    var moodIcon = endScreen.moodIcon = new PIXI.Sprite(moodGoodTexture)
    moodIcon.anchor.set(1.1, 0.5)
    moodIcon.position.set(renderWidth / 3, renderHeight / 2)
    moodIcon.scale.set(4)
    container.addChild(moodIcon)

    var moodText = endScreen.moodText = new PIXI.Text('100', {
      font: '40px monospace',
      fill: 0xFFFFFF
    })
    moodText.anchor.set(-0.1, 0.5)
    moodText.position.set(renderWidth / 3, renderHeight / 2)
    container.addChild(moodText)

    var timeIcon = endScreen.timeIcon = new PIXI.Sprite(timeIconTexture)
    timeIcon.anchor.set(1.1, 0.5)
    timeIcon.position.set(2 * renderWidth / 3, renderHeight / 2)
    timeIcon.scale.set(4)
    container.addChild(timeIcon)

    var timeText = endScreen.timeText = new PIXI.Text('3:52', {
      font: '40px monospace',
      fill: 0xFFFFFF
    })
    timeText.anchor.set(-0.1, 0.5)
    timeText.position.set(2 * renderWidth / 3, renderHeight / 2)
    container.addChild(timeText)

    endScreen.update = function (mood, moodMax, time, failed) {
      moodText.text = '' + mood
      moodIcon.texture = getMoodTexture(mood, moodMax)

      if (time >= 0) {
        timeText.text = formatTime(time)
        timeText.visible = timeIcon.visible = true
        moodText.position.set(renderWidth / 3, renderHeight / 2)
        moodIcon.position.set(renderWidth / 3, renderHeight / 2)
      } else {
        timeText.visible = timeIcon.visible = false
        moodText.position.set(renderWidth / 2, renderHeight / 2)
        moodIcon.position.set(renderWidth / 2, renderHeight / 2)
      }

      if (failed) {
        nextButton.visible = false
        restartButton.anchor.x = 0.5
        title.style.fill = '#AA0000'
        title.text = 'RUINED'
      } else {
        nextButton.visible = true
        restartButton.anchor.x = 1.3
        title.text = 'SAVED'
        title.style.fill = '#00AA00'
      }

      if (levels[Game.currentLevel].nextLevel === undefined) {
        nextButton.visible = false
        restartButton.anchor.x = 0.5
      }
    }

    endScreen.show = function () {
      endScreen.shown = true
      return fadeIn(Game.blackBox).call(function () {
        Game.level = null
        fadeIn(container).call(function () {
          Game.levelContainer.removeChildren()
        })
      })
    }

    endScreen.hide = function () {
      endScreen.shown = false
      return fadeOut(container).call(function () {
        fadeIn(Game.blackBox)
      })
    }

    restartButton.on('click', function () {
      changeLevel(Game.currentLevel)
    })

    nextButton.on('click', function () {
      changeLevel(levels[Game.currentLevel].nextLevel)
    })

    return endScreen
  }

  function updatePerson (house, person) {
    if (person.dx === 0 && person.dy === 0) {
      if (person.path) {
        var direction = person.path.shift()
        if (person.path.length === 0) person.path = null
        person.dx = direction.dx
        person.dy = direction.dy

        changePersonMood(person, 2)
      } else if (!person.idleTimeout) {
        person.idleTimeout = window.setTimeout(function () {
          person.idleTimeout = null
          var dirs = getPossibleDirectionsForPerson(house, person)

          if (dirs.length > 0) {
            var i = Math.floor(Math.random() * dirs.length)
            person.dx = dirs[i].dx
            person.dy = dirs[i].dy
            changePersonMood(person, person.target ? 1 : 2)
          } else {
            changePersonMood(person, 0)
          }
        }, idleTime)
      }
    }

    if (house.locations[person.x][person.y].info.target === person.target) {
      person.target = null
      fadeOut(person.bubble)
      fadeOut(person.targetIcon)

      house.level.happyPersons++

      if (house.level.happyPersons === house.level.persons.length) {
        house.level.end(true)
      }
    }

    person.moodIcon.texture = getMoodTexture(person.mood, 2)

    if (person.dx !== 0) {
      var targetAngle = person.dx > 0 ? -deg45 : deg45
      var sdx = Math.sign(person.dx)
      if (person.animation.rotation !== targetAngle) {
        person.animation.rotation = rotateToAngle(person.animation.rotation, targetAngle, Math.PI / 100)
        person.animation.gotoAndStop(0)
      } else {
        person.container.x += sdx
        person.animation.play()
        var progress = person.container.x - house.getLocationX(person.x) - sdx * house.effectiveTileSize / 2

        if (progress + sdx * house.effectivePersonRadius === 0) {
          house.colBlocked[person.x + sdx]++
        }
        if (progress - sdx * house.effectivePersonRadius === 0) {
          house.colBlocked[person.x]--
        }
        if (progress === 0) {
          house.locations[person.x][person.y].info.person = null
          house.locations[person.x + sdx][person.y].info.person = person
          person.location = house.locations[person.x + sdx][person.y]
        }

        if (Math.abs(person.container.x - house.getLocationX(person.x)) === house.effectiveTileSize) {
          person.dx += -sdx
          person.x += sdx
        }
      }
    } else if (person.dy !== 0) {
      targetAngle = person.dy > 0 ? 0 : deg180
      var sdy = Math.sign(person.dy)
      if (person.animation.rotation !== targetAngle) {
        person.animation.rotation = rotateToAngle(person.animation.rotation, targetAngle, Math.PI / 100)
        person.animation.gotoAndStop(0)
      } else {
        person.container.y += sdy
        person.animation.play()
        progress = person.container.y - house.getLocationY(person.y) - sdy * house.effectiveTileSize / 2

        if (progress + sdy * house.effectivePersonRadius === 0) {
          house.rowBlocked[person.y + sdy]++
        }
        if (progress - sdy * house.effectivePersonRadius === 0) {
          house.rowBlocked[person.y]--
        }
        if (progress === 0) {
          house.locations[person.x][person.y].info.person = null
          house.locations[person.x][person.y + sdy].info.person = person
          person.location = house.locations[person.x][person.y + sdy]
        }

        if (Math.abs(person.container.y - house.getLocationY(person.y)) === house.effectiveTileSize) {
          person.dy += -sdy
          person.y += sdy
        }
      }
    } else {
      person.animation.gotoAndStop(0)
    }
  }

  function findPaths (house, start) {
    var dists = []
    var pred = []
    for (var x = 0; x < house.width; x++) {
      dists[x] = []
      pred[x] = []
      for (var y = 0; y < house.height; y++) {
        dists[x][y] = Infinity
        pred[x][y] = null
      }
    }

    dists[start.x][start.y] = 0
    var openList = [{x: start.x, y: start.y}]
    var closedList = []
    while (openList.length > 0) {
      var lowInd = 0
      for (var i = 0; i < openList.length; i++) {
        if (dists[openList[i].x][openList[i].y] < dists[openList[lowInd].x][openList[lowInd].y]) {
          lowInd = i
        }
      }

      var current = openList.splice(lowInd, 1)[0]
      var currentDist = dists[current.x][current.y]
      var location = house.locations[current.x][current.y].info

      if (current.x > 0 && location.left) {
        var locationLeft = house.locations[current.x - 1][current.y].info
        var distLeft = dists[current.x - 1][current.y]

        if (locationLeft.right && currentDist + 1 < distLeft) {
          dists[current.x - 1][current.y] = currentDist + 1
          pred[current.x - 1][current.y] = { dx: 1, dy: 0 }
          var left = {x: current.x - 1, y: current.y}
          if (openList.indexOf(left) === -1 && closedList.indexOf(left) === -1) {
            openList.push(left)
          }
        }
      }

      if (current.x < house.width - 1 && location.right) {
        var locationRight = house.locations[current.x + 1][current.y].info
        var distRight = dists[current.x + 1][current.y]

        if (locationRight.left && currentDist + 1 < distRight) {
          dists[current.x + 1][current.y] = currentDist + 1
          pred[current.x + 1][current.y] = { dx: -1, dy: 0 }
          var right = {x: current.x + 1, y: current.y}
          if (openList.indexOf(right) === -1 && closedList.indexOf(right) === -1) {
            openList.push(right)
          }
        }
      }

      if (current.y > 0 && location.top) {
        var locationTop = house.locations[current.x][current.y - 1].info
        var distTop = dists[current.x][current.y - 1]

        if (locationTop.bottom && currentDist + 1 < distTop) {
          dists[current.x][current.y - 1] = currentDist + 1
          pred[current.x][current.y - 1] = { dx: 0, dy: 1 }
          var top = {x: current.x, y: current.y - 1}
          if (openList.indexOf(top) === -1 && closedList.indexOf(top) === -1) {
            openList.push(top)
          }
        }
      }

      if (current.y < house.height - 1 && location.bottom) {
        var locationBottom = house.locations[current.x][current.y + 1].info
        var distBottom = dists[current.x][current.y + 1]

        if (locationBottom.top && currentDist + 1 < distBottom) {
          dists[current.x][current.y + 1] = currentDist + 1
          pred[current.x][current.y + 1] = { dx: 0, dy: -1 }
          var bottom = {x: current.x, y: current.y + 1}
          if (openList.indexOf(bottom) === -1 && closedList.indexOf(bottom) === -1) {
            openList.push(bottom)
          }
        }
      }

      closedList.push(current)
    }

    return pred
  }

  function fillRandomHouse (house, roomCount, fillFactor) {
    for (var x = 0; x < house.width; x++) {
      for (var y = 0; y < house.height; y++) {
        var info = {
          top: y > 0 ? house.locations[x][y - 1].info.bottom : false,
          left: x > 0 ? house.locations[x - 1][y].info.right : false,
          right: x < house.width - 1 ? Math.random() < fillFactor : false,
          bottom: y < house.height - 1 ? Math.random() < fillFactor : false
        }
        var sprite = locationImage(house.scale, info.top, info.left, info.right, info.bottom)

        sprite.position.x = house.getLocationX(x)
        sprite.position.y = house.getLocationY(y)

        house.container.addChild(sprite)

        house.locations[x][y] = {
          info: info,
          sprite: sprite
        }
      }
    }
  }

  function generateArrows (house) {
    var leftArrows = new PIXI.Container()
    var rightArrows = new PIXI.Container()
    rightArrows.position.x = house.width * house.effectiveTileSize
    var rowArrows = []
    var colArrows = []

    function wrapClickHandler (arrow, handler, param) {
      arrow.on('click', function () {
        handler(param)
        house.level.pathsOutdated = true
      })
    }

    for (var y = 0; y < house.height; y++) {
      var leftArrow = createArrowSprite(house, y, -1, -1)
      wrapClickHandler(leftArrow, house.shiftLeft, y)
      leftArrows.addChild(leftArrow)
      rowArrows.push(leftArrow)

      var rightArrow = createArrowSprite(house, y, -1, 1)
      wrapClickHandler(rightArrow, house.shiftRight, y)
      rightArrows.addChild(rightArrow)
      rowArrows.push(rightArrow)
    }

    var topArrows = new PIXI.Container()
    var bottomArrows = new PIXI.Container()
    bottomArrows.position.y = house.height * house.effectiveTileSize
    for (var x = 0; x < house.width; x++) {
      var topArrow = createArrowSprite(house, -1, x, -1)
      topArrows.addChild(topArrow)
      wrapClickHandler(topArrow, house.shiftUp, x)
      colArrows.push(topArrow)

      var bottomArrow = createArrowSprite(house, -1, x, 1)
      bottomArrows.addChild(bottomArrow)
      wrapClickHandler(bottomArrow, house.shiftDown, x)
      colArrows.push(bottomArrow)
    }

    var container = new PIXI.Container()
    container.addChild(leftArrows)
    container.addChild(rightArrows)
    container.addChild(topArrows)
    container.addChild(bottomArrows)

    var scrolling = false

    return {
      left: leftArrows,
      right: rightArrows,
      top: topArrows,
      bottom: bottomArrows,
      container: container,
      refresh: function refreshArrows () {
        for (var x = 0; x < house.width; x++) {
          var blocked = house.colBlocked[x] > 0
          colArrows[2 * x].visible = !blocked
          colArrows[2 * x + 1].visible = !blocked
          colArrows[2 * x].filters = scrolling ? [desaturateFilter] : null
          colArrows[2 * x + 1].filters = scrolling ? [desaturateFilter] : null
        }
        for (var y = 0; y < house.height; y++) {
          blocked = house.rowBlocked[y] > 0
          rowArrows[2 * y].visible = !blocked
          rowArrows[2 * y + 1].visible = !blocked
          rowArrows[2 * y].filters = scrolling ? [desaturateFilter] : null
          rowArrows[2 * y + 1].filters = scrolling ? [desaturateFilter] : null
        }
      }
    }
  }

  function createArrowSprite (house, row, column, dir) {
    var sprite = new PIXI.Sprite(arrowTexture)

    sprite.anchor.x = 0
    sprite.anchor.y = 0.5

    if (row >= 0) {
      if (dir < 0) {
        sprite.position.x = -2
        sprite.rotation = deg180
      } else {
        sprite.position.x = 2
      }

      sprite.position.y = row * house.effectiveTileSize + house.effectiveTileSize / 2
    } else {
      if (dir < 0) {
        sprite.position.y = -2
        sprite.rotation = -deg45
      } else {
        sprite.position.y = 2
        sprite.rotation = deg45
      }

      sprite.position.x = column * house.effectiveTileSize + house.effectiveTileSize / 2
    }

    sprite.scale.x = house.scale
    sprite.scale.y = house.scale

    sprite.interactive = true

    return sprite
  }

  function generateRooms (house, numRooms, semiRandom) {
    var thisTargets = targets.slice(0)
    var rooms = []
    for (var i = 0; i < numRooms; i++) {
      var target = thisTargets[Math.floor(Math.random() * thisTargets.length)]
      if (semiRandom) {
        if (thisTargets.length > 1) {
          thisTargets.splice(thisTargets.indexOf(target), 1)
        } else {
          thisTargets = targets.slice(0)
        }
      }

      while (true) {
        var x = Math.floor(Math.random() * house.width)
        var y = Math.floor(Math.random() * house.height)

        var location = house.locations[x][y]
        if (isLocationFree(location) && !location.target) {
          location.info.target = target
          var container = location.sprite.parent
          container.removeChild(location.sprite)
          location.sprite = locationImage(house.scale, location.info.top, location.info.left, location.info.right, location.info.bottom, target)
          location.sprite.position.x = house.getLocationX(x)
          location.sprite.position.y = house.getLocationY(y)
          container.addChild(location.sprite)
          rooms.push(location)
          break
        }
      }
    }

    return rooms
  }

  function staticLevelGenerator (timeLeft, scale, mood, lines) {
    var infos = []

    if (lines.length % 3 !== 0) throw new SyntaxError('Unexpected number of lines')
    if (lines[0].length % 3 !== 0) throw new SyntaxError('Unexpected length of first line')
    var width = lines[0].length / 3
    var height = lines.length / 3
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].length !== lines[0].length) throw new SyntaxError('Unexpected length of line #' + i)
    }
    for (var x = 0; x < width; x++) {
      infos[x] = []
      for (var y = 0; y < height; y++) {
        infos[x][y] = {
          top: lines[3 * y][3 * x + 1] === '.',
          left: lines[3 * y + 1][3 * x] === '.',
          right: lines[3 * y + 1][3 * x + 2] === '.',
          bottom: lines[3 * y + 2][3 * x + 1] === '.'
        }

        var center = lines[3 * y + 1][3 * x + 1]
        var target = parseInt(center, 10)
        if (!isNaN(target)) {
          infos[x][y].target = targets[target]
        } else if (center === 'P') {
          var person = parseInt(lines[3 * y][3 * x + 2], 10)

          if (isNaN(person)) {
            throw new SyntaxError('Missing number for person')
          }

          infos[x][y].person = targets[person]
        }
      }
    }

    return function generator (level) {
      level.timeLeft = timeLeft

      level.moodMax = mood
      level.house = buildHouse(width, height, scale)
      level.persons = []
      level.house.rooms = []

      for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {
          var info = $.extend({}, infos[x][y])
          var sprite = locationImage(scale, info.top, info.left, info.right, info.bottom, info.target)

          sprite.position.x = level.house.getLocationX(x)
          sprite.position.y = level.house.getLocationY(y)

          level.house.container.addChild(sprite)

          level.house.locations[x][y] = {
            info: info,
            sprite: sprite
          }

          if (info.person) {
            var person = createPerson(level.house, x, y, info.person)
            level.persons.push(person)

            level.personContainer.addChild(person.container)
            level.bubbleContainer.addChild(person.overlayContainer)

            info.person = person
          }

          if (info.target) {
            level.house.rooms.push(level.house.locations[x][y])
          }
        }
      }
    }
  }

  function createTopBar (color, background, height) {
    var topBar = {
      container: new PIXI.Container()
    }

    topBar.moodText = new PIXI.Text('', {
      font: '20px Arial',
      fill: color
    })
    topBar.moodText.x = 50
    topBar.moodText.y = topBarHeight / 2
    topBar.moodText.anchor.x = 0
    topBar.moodText.anchor.y = 0.5

    topBar.timerText = new PIXI.Text('', {
      font: '20px Arial',
      fill: color
    })
    topBar.timerText.x = renderWidth - 50
    topBar.timerText.y = topBarHeight / 2
    topBar.timerText.anchor.x = 1
    topBar.timerText.anchor.y = 0.5

    topBar.nameText = new PIXI.Text('', {
      font: 'bold 24px Arial',
      fill: color
    })
    topBar.nameText.x = renderWidth / 2
    topBar.nameText.y = topBarHeight / 2
    topBar.nameText.anchor.x = 0.5
    topBar.nameText.anchor.y = 0.5

    topBar.bar = new PIXI.Graphics()
    topBar.bar.beginFill(background)
    topBar.bar.drawRect(0, 0, renderWidth, height)

    topBar.moodSprite = new PIXI.Sprite(moodGoodTexture)
    topBar.moodSprite.anchor.set(0, 0.5)
    topBar.moodSprite.position.set(5, height / 2)
    topBar.moodSprite.scale.set(2, 2)

    topBar.timeSprite = new PIXI.Sprite(timeIconTexture)
    topBar.timeSprite.anchor.set(1, 0.5)
    topBar.timeSprite.position.set(renderWidth - 5, height / 2)
    topBar.timeSprite.scale.set(2, 2)

    topBar.container.addChild(topBar.bar)
    topBar.container.addChild(topBar.moodText)
    topBar.container.addChild(topBar.moodSprite)
    topBar.container.addChild(topBar.timerText)
    topBar.container.addChild(topBar.nameText)
    topBar.container.addChild(topBar.timeSprite)

    topBar.update = function updateTopBar (currentMood, moodMax, timer, name) {
      topBar.moodText.text = '' + currentMood
      topBar.moodSprite.texture = getMoodTexture(currentMood, moodMax)
      topBar.nameText.text = name
      topBar.timerText.text = formatTime(timer)
      topBar.timeSprite.visible = timer >= 0
    }

    return topBar
  }

  function formatTime (time) {
    if (time >= 0) {
      var minutes = Math.floor(time / 60)
      var seconds = time % 60

      return minutes + ':' + (seconds > 9 ? seconds : '0' + seconds)
    }

    return ''
  }

  function generateRandomPerson (house) {
    var idx = Math.floor(Math.random() * house.rooms.length)
    var target = house.rooms[idx].info.target

    var x, y
    while (true) {
      x = Math.floor(Math.random() * house.width)
      y = Math.floor(Math.random() * house.height)

      if (isLocationFree(house.locations[x][y])) {
        break
      }
    }

    return createPerson(house, x, y, target)
  }

  function randomLevelGenerator (w, h, scale, roomCount, numPersons, mood, semiRandom, timeLeft) {
    if (!timeLeft) timeLeft = -1
    return function generator (level) {
      level.timeLeft = timeLeft
      level.moodMax = mood || numPersons * 30

      level.house = buildHouse(w, h, scale)
      fillRandomHouse(level.house, roomCount, 0.3)

      level.house.rooms = generateRooms(level.house, roomCount, semiRandom)

      level.persons = []
      for (var i = 0; i < numPersons; i++) {
        var person = generateRandomPerson(level.house)

        level.persons.push(person)

        level.personContainer.addChild(person.container)
        level.bubbleContainer.addChild(person.overlayContainer)
      }
    }
  }

  function buildHouse (w, h, scale) {
    if (!scale) scale = 1
    var house = {
      width: w,
      height: h,
      locations: [],
      container: new PIXI.Container(),
      rowBlocked: Array(h).fill(0),
      colBlocked: Array(w).fill(0),

      scale: scale,
      effectivePersonRadius: personRadius * scale,
      effectiveTileSize: tileSize * scale,

      shiftLeft: function shiftLeft (y) {
        var first = house.locations[0][y]

        for (var x = 1; x < house.width; x++) {
          house.locations[x - 1][y] = house.locations[x][y]
          house.locations[x - 1][y].sprite.position.x = house.getLocationX(x - 1)
        }

        house.locations[house.width - 1][y] = first
        house.locations[house.width - 1][y].sprite.position.x = house.getLocationX(house.width - 1)
      },

      shiftRight: function shiftRight (y) {
        var last = house.locations[house.width - 1][y]

        for (var x = house.width - 1; x > 0; x--) {
          house.locations[x][y] = house.locations[x - 1][y]
          house.locations[x][y].sprite.position.x = house.getLocationX(x)
        }

        house.locations[0][y] = last
        house.locations[0][y].sprite.position.x = house.getLocationX(0)
      },

      shiftUp: function shiftUp (x) {
        var first = house.locations[x][0]

        for (var y = 1; y < house.height; y++) {
          house.locations[x][y - 1] = house.locations[x][y]
          house.locations[x][y - 1].sprite.position.y = house.getLocationY(y - 1)
        }

        house.locations[x][house.height - 1] = first
        house.locations[x][house.height - 1].sprite.position.y = house.getLocationY(house.height - 1)
      },

      shiftDown: function shiftDown (x) {
        var last = house.locations[x][house.height - 1]

        for (var y = house.height - 1; y > 0; y--) {
          house.locations[x][y] = house.locations[x][y - 1]
          house.locations[x][y].sprite.position.y = house.getLocationY(y)
        }

        house.locations[x][0] = last
        house.locations[x][0].sprite.position.y = house.getLocationY(0)
      },

      canMove: function canMove (x, y, dx, dy) {
        dx = Math.sign(dx)
        dy = Math.sign(dy)
        if (x + dx < 0 || x + dx >= house.width) return false
        if (y + dy < 0 || y + dy >= house.height) return false
        var self = house.locations[x][y].info
        var other = house.locations[x + dx][y + dy].info

        return (dx > 0 && self.right && other.left) ||
          (dx < 0 && self.left && other.right) ||
          (dy > 0 && self.bottom && other.top) ||
          (dy < 0 && self.top && other.bottom)
      },

      getLocationX: function getLocationX (col) {
        return col * house.effectiveTileSize + house.effectiveTileSize / 2
      },

      getLocationY: function getLocationY (row) {
        return row * house.effectiveTileSize + house.effectiveTileSize / 2
      }
    }

    for (var x = 0; x < w; x++) {
      house.locations.push([])
    }

    return house
  }

  function generateLevel (levelGenerator) {
    var level = {
      pathsOutdated: true
    }

    level.container = new PIXI.Container()
    level.personContainer = new PIXI.Container()
    level.bubbleContainer = new PIXI.Container()

    levelGenerator(level)
    level.house.level = level

    var floorSprite = new PIXI.extras.TilingSprite(floorTexture, level.house.width * level.house.effectiveTileSize, level.house.height * level.house.effectiveTileSize)
    floorSprite.tileScale.set(level.house.scale, level.house.scale)

    level.arrows = generateArrows(level.house)

    level.grid = createGrid(level.house.width, level.house.height, level.house.effectiveTileSize, gridColor)
    level.grid.alpha = gridAlpha

    if (!level.moodMax) level.moodMax = 100
    level.mood = level.moodMax
    level.happyPersons = 0

    level.updateMood = function updateMood () {
      for (var i = 0; i < level.persons.length; i++) {
        level.mood -= level.persons[i].mood > 1 ? 0 : level.persons[i].mood < 1 ? 3 : 1
      }

      if (level.mood <= 0) {
        level.end(false)
      }
    }

    level.updateTimer = function updateMood () {
      level.timeLeft -= 1

      if (level.timeLeft === 0) {
        level.end(false)
      }
    }

    level.update = function update () {
      if (level.pathsOutdated) {
        for (var i = 0; i < level.persons.length; i++) {
          refreshPathForPerson(level.house, level.persons[i])
        }
        level.pathsOutdated = false
      }

      for (i = 0; i < level.persons.length; i++) {
        updatePerson(level.house, level.persons[i])
      }
      level.arrows.refresh()
    }

    level.start = function startLevel () {
      level.moodTimer = window.setInterval(level.updateMood, 5000)
      level.timeTimer = window.setInterval(level.updateTimer, 1000)
    }

    level.end = function endLevel (success) {
      level.end = function () {}

      window.clearInterval(level.moodTimer)
      window.clearInterval(level.timeTimer)

      Game.endScreen.update(level.mood, level.moodMax, level.timeLeft, !success)
      window.setTimeout(Game.endScreen.show, 1000)
    }

    level.container.addChild(floorSprite)
    level.container.addChild(level.house.container)
    level.container.addChild(level.grid)
    level.container.addChild(level.personContainer)
    level.container.addChild(level.arrows.container)
    level.container.addChild(level.bubbleContainer)

    level.container.pivot.set(level.house.width * level.house.effectiveTileSize / 2, level.house.height * level.house.effectiveTileSize / 2)
    level.container.position.set(renderWidth / 2, topBarHeight + (renderHeight - topBarHeight) / 2)

    return level
  }

  function generateLevelSelect (container) {
    var sel = $('<select>').appendTo(container)
    $(levels).each(function (i, level) {
      sel.append($('<option>').attr('value', i).text(level.name))
    })

    sel.change(function () {
      changeLevel(this.value)
    })

    var btn = $('<button>').text('Reset Level').appendTo(container)

    btn.click(function () {
      changeLevel(Game.currentLevel)
    })
  }

  function changeLevel (index) {
    function swapLevel () {
      Game.currentLevel = index
      Game.levelContainer.removeChildren()
      Game.level = generateLevel(levels[index].generator)
      Game.level.name = levels[index].name
      Game.levelContainer.addChild(Game.level.container)

      Game.blackBox.alpha = 1
      fadeOut(Game.blackBox).call(Game.level.start)

      Game.level.arrows.refresh()
      updateTopBar()
    }

    if (Game.endScreen.shown) fadeOut(Game.endScreen.container).call(swapLevel)
    else fadeIn(Game.blackBox).call(swapLevel)
  }

  function onAssetsLoaded () {
    var generator = levels[Game.currentLevel].generator
    Game.level = generateLevel(generator)
    Game.level.name = levels[Game.currentLevel].name

    Game.levelContainer = new PIXI.Container()
    stage.addChild(Game.levelContainer)
    Game.levelContainer.addChild(Game.level.container)

    Game.topBar = createTopBar(topBarColor, topBarBackground, topBarHeight)
    stage.addChild(Game.topBar.container)

    Game.blackBox = new PIXI.Graphics()
    Game.blackBox.beginFill(0x000000)
    Game.blackBox.drawRect(0, 0, renderWidth, renderHeight)
    stage.addChild(Game.blackBox)
    fadeOut(Game.blackBox).call(Game.level.start)

    Game.endScreen = createLevelEndScreen()
    Game.endScreen.container.alpha = 0
    stage.addChild(Game.endScreen.container)

    Game.level.arrows.refresh()

    generateLevelSelect(document.getElementById('levelSelect'))

    main()
  }

  function updateTopBar () {
    Game.topBar.update(Game.level.mood, Game.level.moodMax, Game.level.timeLeft, Game.level.name)
  }

  function main (level) {
    window.requestAnimationFrame(main)

    if (Game.level) {
      Game.level.update()
      updateTopBar()
    }

    renderer.render(stage)
  }

  PIXI.loader.load()
})()
