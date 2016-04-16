(function () {    
    var margin = 40;
    var globalScale = 3;
    var tileSize = 32;
    var topBarHeight = 40;
    var topBarBackground = 0x666666;
    var topBarColor = 0xFFFFFF;
    
    var houseWidth = 10;
    var houseHeight = 6;
    var house = []
    
    var images = [
        'images/block.png',
        'images/tee.png',
        'images/dead-end.png',
        'images/cross.png',
        'images/straight.png'
    ];
    
    var effectiveTileSize = tileSize * globalScale;
    
    var renderWidth = effectiveTileSize * houseWidth + 2 * margin;
    var renderHeight = effectiveTileSize * houseHeight + 2 * margin + topBarHeight;
    
    var renderer = PIXI.autoDetectRenderer(renderWidth, renderHeight, {backgroundColor : 0xFFFFFF});
    document.body.appendChild(renderer.view);
    
    var arrowTexture = PIXI.Texture.fromImage('images/arrow.png', true, PIXI.SCALE_MODES.NEAREST)
    
    var textures = []
    
    for (var i = 0; i < images.length; i++)
    {
        textures[i] = PIXI.Texture.fromImage(images[i], true, PIXI.SCALE_MODES.NEAREST)
    }
    
    var deg180 = Math.PI;
    var deg45  = Math.PI / 2;
    var stage = new PIXI.Container();
    
    var pointsText = new PIXI.Text('Points: 0', {
        font: '16px Arial',
        fill: topBarColor
    });
    pointsText.x = 5;
    pointsText.y = topBarHeight / 2;
    pointsText.anchor.x = 0
    pointsText.anchor.y = 0.5
    
    var topBar = new PIXI.Graphics()
    topBar.beginFill(topBarBackground);
    topBar.drawRect(0, 0, renderWidth, topBarHeight);
    
    stage.addChild(topBar);
    stage.addChild(pointsText);
    
    function createArrowSprite(row, column, dir) {
            var sprite = new PIXI.Sprite(arrowTexture);
            
            sprite.anchor.x = 0;
            sprite.anchor.y = 0.5;
            
            if (row >= 0)
            {
                if (dir < 0) 
                {
                    sprite.position.x = margin - 2;
                    sprite.rotation = deg180;
                }
                else
                {
                    sprite.position.x = renderWidth - margin + 2;
                }
                
                sprite.position.y = topBarHeight + margin + y * effectiveTileSize + effectiveTileSize / 2;                
            }
            else
            {
                if (dir < 0) 
                {
                    sprite.position.y = topBarHeight + margin - 2;
                    sprite.rotation = -deg45;
                }
                else
                {
                    sprite.position.y = renderHeight - margin + 2;
                    sprite.rotation = deg45;
                }
                
                sprite.position.x = margin + x * effectiveTileSize + effectiveTileSize / 2;                   
            }

            sprite.scale.x = globalScale;
            sprite.scale.y = globalScale;  
            
            sprite.interactive = true;
            
            stage.addChild(sprite);
            
            sprite.on('click', function ()
            {
                if (row >= 0)
                {
                    if (dir < 0) shiftRowLeft(row, dir);
                    else shiftRowRight(row, dir);
                }
                else
                {
                    if (dir < 0) shiftColumnUp(column, dir);
                    else shiftColumnDown(column, dir);
                }
            });
            
            return sprite;
    }
    
    function shiftRowLeft(y) {
        var first = house[0][y].info;
        var firstT = house[0][y].sprite.texture;
        
        for (var x = 1; x < houseWidth; x++) {
            house[x-1][y].info = house[x][y].info;
            house[x-1][y].sprite.texture = house[x][y].sprite.texture;
        }
        
        house[houseWidth-1][y].info = first;
        house[houseWidth-1][y].sprite.texture = firstT;
    }
    
    function shiftRowRight(y) {
        var last  = house[houseWidth-1][y].info;
        var lastT = house[houseWidth-1][y].sprite.texture;
        
        for (var x = houseWidth - 1; x > 0; x--) {
            house[x][y].info = house[x-1][y].info;
            house[x][y].sprite.texture = house[x-1][y].sprite.texture;
        }
        
        house[0][y].info = last;
        house[0][y].sprite.texture = lastT;
    }
    
    function shiftColumnUp(x) {
        var first = house[x][0].info;
        var firstT = house[x][0].sprite.texture;
        
        for (var y = 1; y < houseHeight; y++) {
            house[x][y-1].info = house[x][y].info;
            house[x][y-1].sprite.texture = house[x][y].sprite.texture;
        }
        
        house[x][houseHeight-1].info = first;
        house[x][houseHeight-1].sprite.texture = firstT;
    }
    
    function shiftColumnDown(x) {
        var last  = house[x][houseHeight-1].info;
        var lastT = house[x][houseHeight-1].sprite.texture;
        
        for (var y = houseHeight - 1; y > 0; y--) {
            house[x][y].info = house[x][y-1].info;
            house[x][y].sprite.texture = house[x][y-1].sprite.texture;
        }
        
        house[x][0].info = last;
        house[x][0].sprite.texture = lastT;
    }
    
    for (var x = 0; x < houseWidth; x++)
    {
        house[x] = []
        for (var y = 0; y < houseHeight; y++)
        {
            var j = Math.floor(Math.random() * images.length);
            var sprite = new PIXI.Sprite(textures[j]);
            
            sprite.anchor.x = 0;
            sprite.anchor.y = 0;

            sprite.position.x = margin + x * effectiveTileSize;
            sprite.position.y = topBarHeight + margin + y * effectiveTileSize;
            sprite.scale.x = globalScale;
            sprite.scale.y = globalScale;
            
            stage.addChild(sprite);
            
            house[x][y] = {
                info: {
                    top: Math.random() < 0.7,
                    left: Math.random() < 0.7,
                    right: Math.random() < 0.7,
                    bottom: Math.random() < 0.7,
                },
                texture: textures[j],
                sprite: sprite
            }
        }
    }   

    for (var y = 0; y < houseHeight; y++)
    {
        createArrowSprite(y, -1, 1);
        createArrowSprite(y, -1, -1);
    }         
    
    for (var x = 0; x < houseWidth; x++)
    {
        createArrowSprite(-1, x, 1);
        createArrowSprite(-1, x, -1);
    }   
    main();
    function main()
    {
        requestAnimationFrame(main);

        // render the container
        renderer.render(stage);
    }
})();