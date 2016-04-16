(function () {
  var margin = 40
  var globalScale = 3
  var tileSize = 32
  var topBarHeight = 40
  var topBarBackground = 0x666666
  var topBarColor = 0xFFFFFF

  var houseWidth = 10
  var houseHeight = 6
  var house = []

  var textureStraight = PIXI.Texture.fromImage('images/straight.png', true, PIXI.SCALE_MODES.NEAREST)
  var textureBlock = PIXI.Texture.fromImage('images/block.png', true, PIXI.SCALE_MODES.NEAREST)
  var textureTee = PIXI.Texture.fromImage('images/tee.png', true, PIXI.SCALE_MODES.NEAREST)
  var textureDeadEnd = PIXI.Texture.fromImage('images/dead-end.png', true, PIXI.SCALE_MODES.NEAREST)
  var textureCross = PIXI.Texture.fromImage('images/cross.png', true, PIXI.SCALE_MODES.NEAREST)
  var textureAngle = PIXI.Texture.fromImage('images/angle.png', true, PIXI.SCALE_MODES.NEAREST)

  var desaturateFilter = new PIXI.filters.ColorMatrixFilter()
  desaturateFilter.desaturate()

  var targets = ['kitchen', 'bath', 'toilet', 'gym', 'living', 'sleeping']
  var availiableTargets = ['kitchen', 'bath', 'toilet', 'gym', 'living', 'sleeping']

  var effectiveTileSize = tileSize * globalScale

  var renderWidth = effectiveTileSize * houseWidth + 2 * margin
  var renderHeight = effectiveTileSize * houseHeight + 2 * margin + topBarHeight

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

      sprite.position.y = topBarHeight + margin + y * effectiveTileSize + effectiveTileSize / 2
    } else {
      if (dir < 0) {
        sprite.position.y = topBarHeight + margin - 2
        sprite.rotation = -deg45
      } else {
        sprite.position.y = renderHeight - margin + 2
        sprite.rotation = deg45
      }

      sprite.position.x = margin + x * effectiveTileSize + effectiveTileSize / 2
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
    var first = house[0][y].info
    var firstT = house[0][y].sprite.texture

    for (var x = 1; x < houseWidth; x++) {
      house[x - 1][y].info = house[x][y].info
      house[x - 1][y].sprite.texture = house[x][y].sprite.texture
    }

    house[houseWidth - 1][y].info = first
    house[houseWidth - 1][y].sprite.texture = firstT
  }

  function shiftRowRight (y) {
    var last = house[houseWidth - 1][y].info
    var lastT = house[houseWidth - 1][y].sprite.texture

    for (var x = houseWidth - 1; x > 0; x--) {
      house[x][y].info = house[x - 1][y].info
      house[x][y].sprite.texture = house[x - 1][y].sprite.texture
    }

    house[0][y].info = last
    house[0][y].sprite.texture = lastT
  }

  function shiftColumnUp (x) {
    var first = house[x][0].info
    var firstT = house[x][0].sprite.texture

    for (var y = 1; y < houseHeight; y++) {
      house[x][y - 1].info = house[x][y].info
      house[x][y - 1].sprite.texture = house[x][y].sprite.texture
    }

    house[x][houseHeight - 1].info = first
    house[x][houseHeight - 1].sprite.texture = firstT
  }

  function shiftColumnDown (x) {
    var last = house[x][houseHeight - 1].info
    var lastT = house[x][houseHeight - 1].sprite.texture

    for (var y = houseHeight - 1; y > 0; y--) {
      house[x][y].info = house[x][y - 1].info
      house[x][y].sprite.texture = house[x][y - 1].sprite.texture
    }

    house[x][0].info = last
    house[x][0].sprite.texture = lastT
  }

  function corridorImage (top, left, right, bottom) {
    var texture
    var rotation = 0

    if (top && bottom && left && right) {
      texture = textureCross
    } else if (!top && !bottom && !left && !right) {
      texture = textureBlock
    } else if (top && bottom && !left && !right) {
      texture = textureStraight
    } else if (!top && !bottom && left && right) {
      texture = textureStraight
      rotation = deg45
    // Dead End
    } else if (!top && bottom && !left && !right) {
      texture = textureDeadEnd
    } else if (!top && !bottom && left && !right) {
      texture = textureDeadEnd
      rotation = deg45
    } else if (!top && !bottom && !left && right) {
      texture = textureDeadEnd
      rotation = -deg45
    } else if (top && !bottom && !left && !right) {
      texture = textureDeadEnd
      rotation = deg180
    // Angle
    } else if (!top && bottom && left && !right) {
      texture = textureAngle
    } else if (!top && bottom && !left && right) {
      texture = textureAngle
      rotation = -deg45
    } else if (top && !bottom && left && !right) {
      texture = textureAngle
      rotation = deg45
    } else if (top && !bottom && !left && right) {
      texture = textureAngle
      rotation = deg180
    // Tee-Junction
    } else if (!top && bottom && left && right) {
      texture = textureTee
    } else if (top && !bottom && left && right) {
      texture = textureTee
      rotation = deg180
    } else if (top && bottom && !left && right) {
      texture = textureTee
      rotation = -deg45
    } else if (top && bottom && left && !right) {
      texture = textureTee
      rotation = deg45
    }

    var sprite = new PIXI.Sprite(texture)
    sprite.scale.x = globalScale
    sprite.scale.y = globalScale
    sprite.pivot.set(0, 0)
    sprite.anchor.set(0.5, 0.5)
    sprite.rotation = rotation

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

  var rowsScrolling = true
  var rowBlocked = Array(houseHeight).fill(0)
  var colBlocked = Array(houseWidth).fill(0)

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
      location: location
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

  for (var x = 0; x < houseWidth; x++) {
    house[x] = []
    for (var y = 0; y < houseHeight; y++) {
      var info = {
        top: y > 0 ? house[x][y - 1].info.bottom : Math.random() < 0.6,
        left: x > 0 ? house[x - 1][y].info.right : Math.random() < 0.6,
        right: Math.random() < 0.5,
        bottom: Math.random() < 0.6
      }
      var sprite = corridorImage(info.top, info.left, info.right, info.bottom)

      sprite.position.x = getLocationX(x)
      sprite.position.y = getLocationY(y)

      stage.addChild(sprite)

      house[x][y] = {
        info: info,
        sprite: sprite
      }
    }
  }

  var rowArrows = []
  var colArrows = []

  for (y = 0; y < houseHeight; y++) {
    rowArrows.push(createArrowSprite(y, -1, 1))
    rowArrows.push(createArrowSprite(y, -1, -1))
  }

  for (x = 0; x < houseWidth; x++) {
    colArrows.push(createArrowSprite(-1, x, 1))
    colArrows.push(createArrowSprite(-1, x, -1))
  }

  for (var i = 0; i < 3; i++) {
    createPerson()
  }

  refreshArrows()

  main()
  function main () {
    window.requestAnimationFrame(main)

    renderer.render(stage)
  }
})()
