(function () {
  var margin = 40
  var globalScale = 3
  var tileSize = 32
  var topBarHeight = 50
  var topBarBackground = 0x666666
  var topBarColor = 0xFFFFFF
  var personRadius = 12 / 2
  var iconFadeTime = 1500
  var idleTime = 2000
  var initialMood = 100

  var houseWidth = 10
  var houseHeight = 6
  var numRooms = 6
  var numPersons = 3
  var gridColor = 0x666666
  var gridAlpha = 0.6

  PIXI.loader.add('corridor-straight', 'images/straight.png')
  PIXI.loader.add('arrow', 'images/arrow.png')

  PIXI.loader.once('complete', onAssetsLoaded)

  var bubbleTexture = PIXI.Texture.fromImage('images/bubble.png', true, PIXI.SCALE_MODES.NEAREST)
  var moodGoodTexture = PIXI.Texture.fromImage('images/mood-good.png', true, PIXI.SCALE_MODES.NEAREST)
  var moodBadTexture = PIXI.Texture.fromImage('images/mood-bad.png', true, PIXI.SCALE_MODES.NEAREST)
  var moodNeutralTexture = PIXI.Texture.fromImage('images/mood-neutral.png', true, PIXI.SCALE_MODES.NEAREST)

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

  var targets = ['kitchen', 'bath', 'toilet', 'gym', 'living', 'sleeping']

  var effectivePersonRadius = personRadius * globalScale
  var effectiveTileSize = tileSize * globalScale

  var renderWidth = effectiveTileSize * houseWidth + 2 * margin
  var renderHeight = effectiveTileSize * houseHeight + 2 * margin + topBarHeight

  var renderer = PIXI.autoDetectRenderer(renderWidth, renderHeight,
    {
      backgroundColor: 0x000000
    }
  )
  document.body.appendChild(renderer.view)

  var deg180 = Math.PI
  var deg45 = Math.PI / 2
  var stage = new PIXI.Container()

  function getMoodTexture (mood) {
    return mood >= 50 ? moodGoodTexture : mood <= -50 ? moodBadTexture : moodNeutralTexture
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

  function locationImage (top, left, right, bottom, room) {
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

    sprite.scale.x = globalScale
    sprite.scale.y = globalScale

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

  function createPerson (house) {
    var personAnim = new PIXI.extras.MovieClip(personTextures)

    personAnim.scale.set(globalScale, globalScale)
    personAnim.animationSpeed = 0.06
    personAnim.anchor.set(0.5, 0.5)
    personAnim.interactive = true

    var target = house.rooms[Math.floor(Math.random() * house.rooms.length)].info.target

    var location = null
    var x, y

    while (!location) {
      x = Math.floor(Math.random() * house.width)
      y = Math.floor(Math.random() * house.height)

      if (isLocationFree(house.locations[x][y])) {
        location = house.locations[x][y]
      }
    }

    var bubble = new PIXI.Sprite(bubbleTexture)
    bubble.anchor.set(0, 1.1)
    bubble.scale.set(globalScale, globalScale)

    var targetIcon = new PIXI.Sprite(iconTextures[target])
    targetIcon.anchor.set(-0.3, 1.6)
    targetIcon.scale.set(globalScale, globalScale)

    var moodIcon = new PIXI.Sprite(getMoodTexture(100))
    moodIcon.anchor.set(1, 1.6)
    moodIcon.scale.set(2, 2)
    moodIcon.alpha = 0

    var container = new PIXI.Container()
    container.position.set(getLocationX(x), getLocationY(y))
    container.addChild(personAnim)
    container.addChild(bubble)
    container.addChild(targetIcon)
    container.addChild(moodIcon)

    house.rowBlocked[y]++
    house.colBlocked[x]++

    var person = {
      animation: personAnim,
      container: container,
      target: target,
      location: location,
      targetIcon: targetIcon,
      moodIcon: moodIcon,
      bubble: bubble,
      x: x,
      y: y,
      dx: 0,
      dy: 0,
      happiness: 100
    }

    personAnim.on('mouseover', function () {
      moodIcon.alpha = 0
      createjs.Tween.get(person.moodIcon)
        .to({ alpha: 1 }, 500, createjs.Ease.getPowInOut(4))
      if (person.iconTimeout) {
        window.clearTimeout(person.iconTimeout)
        person.iconTimeout = null
      }
    })
    personAnim.on('mouseout', function () {
      person.iconTimeout = window.setTimeout(function () {
        createjs.Tween.get(person.moodIcon)
          .to({ alpha: 0 }, 500, createjs.Ease.getPowInOut(4))
        person.iconTimeout = null
      }, iconFadeTime)
    })

    location.info.person = person

    return person
  }

  function getLocationX (col) {
    return margin + col * effectiveTileSize + effectiveTileSize / 2
  }

  function getLocationY (row) {
    return topBarHeight + margin + row * effectiveTileSize + effectiveTileSize / 2
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
      if (person.container.position.x !== getLocationX(person.x) ||
          person.container.position.y !== getLocationY(person.y)) {
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
      person.moodIcon.texture = getMoodTexture(newMood)

      if (!person.iconTimeout) {
        createjs.Tween.get(person.moodIcon)
          .to({ alpha: 1 }, 500, createjs.Ease.getPowInOut(4))
        person.iconTimeout = window.setTimeout(function () {
          createjs.Tween.get(person.moodIcon)
            .to({ alpha: 0 }, 500, createjs.Ease.getPowInOut(4))
          person.iconTimeout = null
        }, iconFadeTime + 500)
      }
    }
    person.mood = newMood
  }

  function updatePerson (house, person) {
    if (person.dx === 0 && person.dy === 0) {
      if (person.path) {
        var direction = person.path.shift()
        if (person.path.length === 0) person.path = null
        person.dx = direction.dx
        person.dy = direction.dy

        changePersonMood(person, 100)
      } else if (!person.idleTimeout) {
        person.idleTimeout = window.setTimeout(function () {
          person.idleTimeout = null
          var dirs = getPossibleDirectionsForPerson(house, person)

          if (dirs.length > 0) {
            var i = Math.floor(Math.random() * dirs.length)
            person.dx = dirs[i].dx
            person.dy = dirs[i].dy
            changePersonMood(person, person.target ? 0 : 100)
          } else {
            changePersonMood(person, -100)
          }
        }, idleTime)
      }
    }

    if (house.locations[person.x][person.y].info.target === person.target) {
      person.target = null
      createjs.Tween.get(person.bubble)
        .to({ alpha: 0 }, 500, createjs.Ease.getPowInOut(4))
      createjs.Tween.get(person.targetIcon)
        .to({ alpha: 0 }, 500, createjs.Ease.getPowInOut(4))
    }

    person.moodIcon.texture = getMoodTexture(person.mood)

    if (person.dx !== 0) {
      var targetAngle = person.dx > 0 ? -deg45 : deg45
      var sdx = Math.sign(person.dx)
      if (person.animation.rotation !== targetAngle) {
        person.animation.rotation = rotateToAngle(person.animation.rotation, targetAngle, Math.PI / 100)
        person.animation.gotoAndStop(0)
      } else {
        person.container.x += sdx
        person.animation.play()
        var progress = person.container.x - getLocationX(person.x) - sdx * effectiveTileSize / 2

        if (progress + sdx * effectivePersonRadius === 0) {
          house.colBlocked[person.x + sdx]++
        }
        if (progress - sdx * effectivePersonRadius === 0) {
          house.colBlocked[person.x]--
        }
        if (progress === 0) {
          house.locations[person.x][person.y].info.person = null
          house.locations[person.x + sdx][person.y].info.person = person
          person.location = house.locations[person.x + sdx][person.y]
        }

        if (Math.abs(person.container.x - getLocationX(person.x)) === effectiveTileSize) {
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
        progress = person.container.y - getLocationY(person.y) - sdy * effectiveTileSize / 2

        if (progress + sdy * effectivePersonRadius === 0) {
          house.rowBlocked[person.y + sdy]++
        }
        if (progress - sdy * effectivePersonRadius === 0) {
          house.rowBlocked[person.y]--
        }
        if (progress === 0) {
          house.locations[person.x][person.y].info.person = null
          house.locations[person.x][person.y + sdy].info.person = person
          person.location = house.locations[person.x][person.y + sdy]
        }

        if (Math.abs(person.container.y - getLocationY(person.y)) === effectiveTileSize) {
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

  function generateHouse (w, h, roomCount, fillFactor) {
    var house = {
      width: w,
      height: h,
      fillFactor: fillFactor,
      roomCount: roomCount,
      locations: [],
      container: new PIXI.Container(),
      rowBlocked: Array(h).fill(0),
      colBlocked: Array(w).fill(0),

      shiftLeft: function shiftLeft (y) {
        var first = house.locations[0][y]

        for (var x = 1; x < house.width; x++) {
          house.locations[x - 1][y] = house.locations[x][y]
          house.locations[x - 1][y].sprite.position.x = getLocationX(x - 1)
        }

        house.locations[house.width - 1][y] = first
        house.locations[house.width - 1][y].sprite.position.x = getLocationX(house.width - 1)
      },

      shiftRight: function shiftRight (y) {
        var last = house.locations[house.width - 1][y]

        for (var x = house.width - 1; x > 0; x--) {
          house.locations[x][y] = house.locations[x - 1][y]
          house.locations[x][y].sprite.position.x = getLocationX(x)
        }

        house.locations[0][y] = last
        house.locations[0][y].sprite.position.x = getLocationX(0)
      },

      shiftUp: function shiftUp (x) {
        var first = house.locations[x][0]

        for (var y = 1; y < house.height; y++) {
          house.locations[x][y - 1] = house.locations[x][y]
          house.locations[x][y - 1].sprite.position.y = getLocationY(y - 1)
        }

        house.locations[x][house.height - 1] = first
        house.locations[x][house.height - 1].sprite.position.y = getLocationY(house.height - 1)
      },

      shiftDown: function shiftDown (x) {
        var last = house.locations[x][house.height - 1]

        for (var y = house.height - 1; y > 0; y--) {
          house.locations[x][y] = house.locations[x][y - 1]
          house.locations[x][y].sprite.position.y = getLocationY(y)
        }

        house.locations[x][0] = last
        house.locations[x][0].sprite.position.y = getLocationY(0)
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
      }
    }

    for (var x = 0; x < w; x++) {
      house.locations[x] = []
      for (var y = 0; y < h; y++) {
        var info = {
          top: y > 0 ? house.locations[x][y - 1].info.bottom : false,
          left: x > 0 ? house.locations[x - 1][y].info.right : false,
          right: x < w - 1 ? Math.random() < fillFactor : false,
          bottom: y < h - 1 ? Math.random() < fillFactor : false
        }
        var sprite = locationImage(info.top, info.left, info.right, info.bottom)

        sprite.position.x = getLocationX(x)
        sprite.position.y = getLocationY(y)

        house.container.addChild(sprite)

        house.locations[x][y] = {
          info: info,
          sprite: sprite
        }
      }
    }

    return house
  }

  function generateArrows (house) {
    var leftArrows = new PIXI.Container()
    var rightArrows = new PIXI.Container()
    rightArrows.position.x = house.width * effectiveTileSize
    var rowArrows = []
    var colArrows = []

    function wrapClickHandler (arrow, handler, param) {
      arrow.on('click', function () {
        handler(param)
        house.level.pathsOutdated = true
      })
    }

    for (var y = 0; y < house.height; y++) {
      var leftArrow = createArrowSprite(y, -1, -1)
      wrapClickHandler(leftArrow, house.shiftLeft, y)
      leftArrows.addChild(leftArrow)
      rowArrows.push(leftArrow)

      var rightArrow = createArrowSprite(y, -1, 1)
      wrapClickHandler(rightArrow, house.shiftRight, y)
      rightArrows.addChild(rightArrow)
      rowArrows.push(rightArrow)
    }

    var topArrows = new PIXI.Container()
    var bottomArrows = new PIXI.Container()
    bottomArrows.position.y = house.height * effectiveTileSize
    for (var x = 0; x < house.width; x++) {
      var topArrow = createArrowSprite(-1, x, -1)
      topArrows.addChild(topArrow)
      wrapClickHandler(topArrow, house.shiftUp, x)
      colArrows.push(topArrow)

      var bottomArrow = createArrowSprite(-1, x, 1)
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

  function createArrowSprite (row, column, dir) {
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

      sprite.position.y = row * effectiveTileSize + effectiveTileSize / 2
    } else {
      if (dir < 0) {
        sprite.position.y = -2
        sprite.rotation = -deg45
      } else {
        sprite.position.y = 2
        sprite.rotation = deg45
      }

      sprite.position.x = column * effectiveTileSize + effectiveTileSize / 2
    }

    sprite.scale.x = globalScale
    sprite.scale.y = globalScale

    sprite.interactive = true

    return sprite
  }

  function generateRooms (house, numRooms) {
    var rooms = []
    for (var i = 0; i < numRooms; i++) {
      var target = targets.splice(Math.floor(Math.random() * targets.length), 1)[0]
      while (true) {
        var x = Math.floor(Math.random() * house.width)
        var y = Math.floor(Math.random() * house.height)

        var location = house.locations[x][y]
        if (isLocationFree(location)) {
          location.info.target = target
          var container = location.sprite.parent
          container.removeChild(location.sprite)
          location.sprite = locationImage(location.info.top, location.info.left, location.info.right, location.info.bottom, target)
          location.sprite.position.x = getLocationX(x)
          location.sprite.position.y = getLocationY(y)
          container.addChild(location.sprite)
          rooms.push(location)
          break
        }
      }
    }

    return rooms
  }

  function createTopBar (color, background, height, currentMood) {
    var topBar = {
      container: new PIXI.Container(),
      currentMood: currentMood
    }

    topBar.moodText = new PIXI.Text(currentMood, {
      font: '16px Arial',
      fill: color
    })
    topBar.moodText.x = 50
    topBar.moodText.y = topBarHeight / 2
    topBar.moodText.anchor.x = 0
    topBar.moodText.anchor.y = 0.5

    topBar.bar = new PIXI.Graphics()
    topBar.bar.beginFill(background)
    topBar.bar.drawRect(0, 0, renderWidth, height)

    var moodIcon = getMoodTexture(topBar.currentMood)
    topBar.moodSprite = new PIXI.Sprite(moodIcon)
    topBar.moodSprite.anchor.set(0, 0.5)
    topBar.moodSprite.position.set(5, height / 2)
    topBar.moodSprite.scale.set(2, 2)

    topBar.container.addChild(topBar.bar)
    topBar.container.addChild(topBar.moodText)
    topBar.container.addChild(topBar.moodSprite)

    return topBar
  }

  function generateLevel (w, h, roomCount, numPersons) {
    var level = {
      pathsOutdated: true
    }

    level.container = new PIXI.Container()

    var floorSprite = new PIXI.extras.TilingSprite(floorTexture, w * effectiveTileSize, h * effectiveTileSize)
    floorSprite.tileScale.set(globalScale, globalScale)
    floorSprite.position.set(margin, margin + topBarHeight)

    level.container.addChild(floorSprite)

    level.house = generateHouse(w, h, roomCount, 0.3)
    level.house.level = level
    level.container.addChild(level.house.container)

    level.arrows = generateArrows(level.house)
    level.arrows.container.position.set(margin, margin + topBarHeight)
    level.container.addChild(level.arrows.container)

    level.house.rooms = generateRooms(level.house, roomCount)

    level.grid = createGrid(level.house.width, level.house.height, effectiveTileSize, gridColor)
    level.grid.position.set(margin, margin + topBarHeight)
    level.grid.alpha = gridAlpha
    level.container.addChild(level.grid)

    level.persons = []
    level.personContainer = new PIXI.Container()
    level.container.addChild(level.personContainer)
    for (var i = 0; i < numPersons; i++) {
      var person = createPerson(level.house)
      level.persons.push(person)
      level.personContainer.addChild(person.container)
    }

    level.topBar = createTopBar(topBarColor, topBarBackground, topBarHeight, initialMood)
    level.container.addChild(level.topBar.container)

    level.updateMood = function updateMood () {
      for (var i = 0; i < level.persons.length; i++) {
        level.topBar.currentMood -= level.persons[i].mood > 0 ? 0 : level.persons[i].mood < 0 ? 3 : 1
      }

      level.refreshMoodDisplay()
    }

    level.refreshMoodDisplay = function refreshMoodDisplay () {
      level.topBar.moodText.text = '' + level.topBar.currentMood
      level.topBar.moodSprite.texture = getMoodTexture(level.topBar.currentMood)
    }

    window.setInterval(level.updateMood, 5000)

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

    return level
  }

  function onAssetsLoaded () {
    window.level = generateLevel(houseWidth, houseHeight, numRooms, numPersons)

    stage.addChild(window.level.container)

    window.level.arrows.refresh()

    main()
  }

  function main (level) {
    window.requestAnimationFrame(main)

    window.level.update()

    renderer.render(stage)
  }

  PIXI.loader.load()
})()
