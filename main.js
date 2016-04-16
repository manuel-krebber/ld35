(function () {
  var margin = 40
  var globalScale = 3
  var tileSize = 32
  var topBarHeight = 40
  var topBarBackground = 0x666666
  var topBarColor = 0xFFFFFF
  var personRadius = 12 / 2

  var houseWidth = 10
  var houseHeight = 6
  var house = []
  var numRooms = 3

  PIXI.loader.add('corridor-straight', 'images/straight.png')
  PIXI.loader.add('arrow', 'images/arrow.png')

  PIXI.loader.once('complete', onAssetsLoaded)

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
    'sleeping': PIXI.Texture.fromImage('images/icon-sleeping.png', true, PIXI.SCALE_MODES.NEAREST)
  }

  var desaturateFilter = new PIXI.filters.ColorMatrixFilter()
  desaturateFilter.desaturate()

  // var targets = ['kitchen', 'bath', 'toilet', 'gym', 'living', 'sleeping']
  var targets = ['kitchen', 'sleeping']
  var availiableTargets = []

  var effectivePersonRadius = personRadius * globalScale
  var effectiveTileSize = tileSize * globalScale

  var renderWidth = effectiveTileSize * houseWidth + 2 * margin
  var renderHeight = effectiveTileSize * houseHeight + 2 * margin + topBarHeight

  var rowsScrolling = false
  var rowBlocked = Array(houseHeight).fill(0)
  var colBlocked = Array(houseWidth).fill(0)
  var rowArrows = []
  var colArrows = []

  var renderer = PIXI.autoDetectRenderer(renderWidth, renderHeight,
    {
      backgroundColor: 0xFFFFFF
    }
  )
  document.body.appendChild(renderer.view)

  var arrowTexture = PIXI.Texture.fromImage('images/arrow.png', true, PIXI.SCALE_MODES.NEAREST)

  var deg180 = Math.PI
  var deg45 = Math.PI / 2
  var stage = new PIXI.Container()

  var pointsText = new PIXI.Text('Points: 0',
    {
      font: '16px Arial',
      fill: topBarColor
    })
  pointsText.x = 5
  pointsText.y = topBarHeight / 2
  pointsText.anchor.x = 0
  pointsText.anchor.y = 0.5

  var topBar = new PIXI.Graphics()
  topBar.beginFill(topBarBackground)
  topBar.drawRect(0, 0, renderWidth, topBarHeight)

  stage.addChild(topBar)
  stage.addChild(pointsText)

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

  function createArrowSprite (row, column, dir) {
    var sprite = new PIXI.Sprite(arrowTexture)

    sprite.anchor.x = 0
    sprite.anchor.y = 0.5

    if (row >= 0) {
      if (dir < 0) {
        sprite.position.x = margin - 2
        sprite.rotation = deg180
      } else {
        sprite.position.x = renderWidth - margin + 2
      }

      sprite.position.y = getLocationY(row)
    } else {
      if (dir < 0) {
        sprite.position.y = topBarHeight + margin - 2
        sprite.rotation = -deg45
      } else {
        sprite.position.y = renderHeight - margin + 2
        sprite.rotation = deg45
      }

      sprite.position.x = getLocationX(column)
    }

    sprite.scale.x = globalScale
    sprite.scale.y = globalScale

    sprite.interactive = true

    stage.addChild(sprite)

    sprite.on('click', function () {
      if (row >= 0) {
        if (dir < 0) shiftRowLeft(row, dir)
        else shiftRowRight(row, dir)
      } else {
        if (dir < 0) shiftColumnUp(column, dir)
        else shiftColumnDown(column, dir)
      }
    })

    return sprite
  }

  function shiftRowLeft (y) {
    var first = house[0][y]

    for (var x = 1; x < houseWidth; x++) {
      house[x - 1][y] = house[x][y]
      house[x - 1][y].sprite.position.x = getLocationX(x - 1)
    }

    house[houseWidth - 1][y] = first
    house[houseWidth - 1][y].sprite.position.x = getLocationX(houseWidth - 1)
  }

  function shiftRowRight (y) {
    var last = house[houseWidth - 1][y]

    for (var x = houseWidth - 1; x > 0; x--) {
      house[x][y] = house[x - 1][y]
      house[x][y].sprite.position.x = getLocationX(x)
    }

    house[0][y] = last
    house[0][y].sprite.position.x = getLocationX(0)
  }

  function shiftColumnUp (x) {
    var first = house[x][0]

    for (var y = 1; y < houseHeight; y++) {
      house[x][y - 1] = house[x][y]
      house[x][y - 1].sprite.position.y = getLocationY(y - 1)
    }

    house[x][houseHeight - 1] = first
    house[x][houseHeight - 1].sprite.position.y = getLocationY(houseHeight - 1)
  }

  function shiftColumnDown (x) {
    var last = house[x][houseHeight - 1]

    for (var y = houseHeight - 1; y > 0; y--) {
      house[x][y] = house[x][y - 1]
      house[x][y].sprite.position.y = getLocationY(y)
    }

    house[x][0] = last
    house[x][0].sprite.position.y = getLocationY(0)
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

  function refreshArrows () {
    for (var x = 0; x < houseWidth; x++) {
      var blocked = colBlocked[x] > 0
      colArrows[2 * x].visible = !blocked
      colArrows[2 * x + 1].visible = !blocked
      colArrows[2 * x].filters = rowsScrolling ? [desaturateFilter] : null
      colArrows[2 * x + 1].filters = rowsScrolling ? [desaturateFilter] : null
    }
    for (var y = 0; y < houseHeight; y++) {
      blocked = rowBlocked[y] > 0
      rowArrows[2 * y].visible = !blocked
      rowArrows[2 * y + 1].visible = !blocked
      rowArrows[2 * y].filters = rowsScrolling ? [desaturateFilter] : null
      rowArrows[2 * y + 1].filters = rowsScrolling ? [desaturateFilter] : null
    }
  }

  function createPerson () {
    var personAnim = new PIXI.extras.MovieClip([
      PIXI.Texture.fromImage('images/person.png', true, PIXI.SCALE_MODES.NEAREST),
      PIXI.Texture.fromImage('images/person-anim-1.png', true, PIXI.SCALE_MODES.NEAREST),
      PIXI.Texture.fromImage('images/person.png', true, PIXI.SCALE_MODES.NEAREST),
      PIXI.Texture.fromImage('images/person-anim-2.png', true, PIXI.SCALE_MODES.NEAREST)
    ])

    personAnim.scale.set(globalScale, globalScale)
    personAnim.animationSpeed = 0.06
    personAnim.anchor.set(0.5, 0.5)
    var target = availiableTargets[Math.floor(Math.random() * availiableTargets.length)]

    var location = null
    var x, y

    while (!location) {
      x = Math.floor(Math.random() * houseWidth)
      y = Math.floor(Math.random() * houseHeight)

      if (isLocationFree(house[x][y])) {
        location = house[x][y]
        personAnim.position.set(getLocationX(x), getLocationY(y))
      }
    }

    rowBlocked[y]++
    colBlocked[x]++

    var person = {
      animation: personAnim,
      target: target,
      location: location,
      x: x,
      y: y,
      dx: 0,
      dy: 0
    }

    location.info.person = person

    stage.addChild(personAnim)

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

  function updatePerson (person) {
    if (person.dx !== 0) {
      var targetAngle = person.dx > 0 ? -deg45 : deg45
      var sdx = Math.sign(person.dx)
      if (person.animation.rotation !== targetAngle) {
        person.animation.rotation = rotateToAngle(person.animation.rotation, targetAngle, Math.PI / 100)
        person.animation.gotoAndStop(0)
      } else {
        person.animation.x += sdx
        person.animation.play()
        var progress = person.animation.x - getLocationX(person.x) - sdx * effectiveTileSize / 2

        if (progress + sdx * effectivePersonRadius === 0) {
          colBlocked[person.x + sdx]++
        }
        if (progress - sdx * effectivePersonRadius === 0) {
          colBlocked[person.x]--
        }
        if (progress === 0) {
          house[person.x][person.y].info.person = null
          house[person.x + sdx][person.y].info.person = person
          person.location = house[person.x + sdx][person.y]
        }

        if (Math.abs(person.animation.x - getLocationX(person.x)) === effectiveTileSize) {
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
        person.animation.y += sdy
        person.animation.play()
        progress = person.animation.y - getLocationY(person.y) - sdy * effectiveTileSize / 2

        if (progress + sdy * effectivePersonRadius === 0) {
          rowBlocked[person.y + sdy]++
        }
        if (progress - sdy * effectivePersonRadius === 0) {
          rowBlocked[person.y]--
        }
        if (progress === 0) {
          house[person.x][person.y].info.person = null
          house[person.x][person.y + sdy].info.person = person
          person.location = house[person.x][person.y + sdy]
        }

        if (Math.abs(person.animation.y - getLocationY(person.y)) === effectiveTileSize) {
          person.dy += -sdy
          person.y += sdy
        }
      }
    } else {
      person.animation.gotoAndStop(0)
    }
  }

  function generateLevel () {
    for (var x = 0; x < houseWidth; x++) {
      house[x] = []
      for (var y = 0; y < houseHeight; y++) {
        var info = {
          top: y > 0 ? house[x][y - 1].info.bottom : Math.random() < 0.3,
          left: x > 0 ? house[x - 1][y].info.right : Math.random() < 0.3,
          right: Math.random() < 0.3,
          bottom: Math.random() < 0.3
        }
        var sprite = locationImage(info.top, info.left, info.right, info.bottom)

        sprite.position.x = getLocationX(x)
        sprite.position.y = getLocationY(y)

        stage.addChild(sprite)

        house[x][y] = {
          info: info,
          sprite: sprite
        }
      }
    }

    for (y = 0; y < houseHeight; y++) {
      rowArrows.push(createArrowSprite(y, -1, 1))
      rowArrows.push(createArrowSprite(y, -1, -1))
    }

    for (x = 0; x < houseWidth; x++) {
      colArrows.push(createArrowSprite(-1, x, 1))
      colArrows.push(createArrowSprite(-1, x, -1))
    }

    for (var i = 0; i < numRooms; i++) {
      var room = null

      var target = targets[Math.floor(Math.random() * targets.length)]
      availiableTargets.push(target)
      while (!room) {
        x = Math.floor(Math.random() * houseWidth)
        y = Math.floor(Math.random() * houseHeight)

        var location = house[x][y]
        if (isLocationFree(location)) {
          location.info.target = target
          stage.removeChild(location.sprite)
          location.sprite = locationImage(location.info.top, location.info.left, location.info.right, location.info.bottom, target)
          location.sprite.position.x = getLocationX(x)
          location.sprite.position.y = getLocationY(y)
          stage.addChild(location.sprite)
          room = true
        }
      }
    }

    var grid = createGrid(houseWidth, houseHeight, effectiveTileSize, 0x666666)
    grid.position.set(margin, margin + topBarHeight)
    grid.alpha = 0.5
    stage.addChild(grid)

    var person = createPerson()
    person.dx = -3 + Math.floor(Math.random() * 7)
    person.dy = -3 + Math.floor(Math.random() * 7)
  }

  function onAssetsLoaded () {
    console.log('loaded')
    generateLevel()
    refreshArrows()

    main()
  }

  function main () {
    window.requestAnimationFrame(main)

    // updatePerson(person)
    refreshArrows()

    renderer.render(stage)
  }

  PIXI.loader.load()
})()
