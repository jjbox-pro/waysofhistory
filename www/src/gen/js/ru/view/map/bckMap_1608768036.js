bckMap = function(parent){
	this.setMap(parent);
	
	bckMap.superclass.constructor.apply(this, arguments);
	
	this.init();
};
	
utils.extend(bckMap, Block);


bckMap.prototype.calcName = function(){
    return 'back';
};

bckMap.prototype.addNotif = function(){
    this.notif.other[Notif.ids.mapShow] = this.runShow;
    this.notif.other[Notif.ids.accMap] = 
    this.notif.other[Notif.ids.townImpBuilt] = 
    this.notif.other[Notif.ids.updView] = this.updView;
    this.notif.other[Notif.ids.mapRender] = this.tryRender;
    this.notif.other[Notif.ids.mapSettings] = 
    this.notif.other[Notif.ids.mapShowRoute] = this.requestRender;
    this.notif.other[Notif.ids.mapMode] = this.setMode;
    this.notif.other[Notif.ids.mapZoom] = this.setZoom;
    this.notif.other[Notif.ids.accTowns] = function(){
        // Задержка, т.к. при удалении/добавлении города, сервер может не отдавать сразу данные по чанкам.
        this.setTimeout(function(){
            this.map.setUpd();

            this.refresh();
        }, 1000);
    };
    this.notif.other[Notif.ids.reqGetMapChunks] = function(data){
        this.chunksLoadTimeout = false;

        this.prepareChunks(data);
    };
    this.notif.other[Notif.ids.reqGetCountryTowns] = function(data){
        this.auraTowns = this.countryTowns = data;

        delete this.waitCountryTowns;

        notifMgr.runEvent(Notif.ids.mapSettings);
    };
    this.notif.other[Notif.ids.mapResLoaded] = function(mark){
        if( mark == 'calcImgLayers' )
            this.requestRender();
    };
};

bckMap.prototype.calcChildren = function(){
    this.children.curBtns = bMapCurBtns;

    this.children.arrows = bMapArrows;
};

bckMap.prototype.bindEvent = function(){
    var canvasSelector = '#'+this.canvasId;

    if( utils.isMobileDevice() )
        this.bindTouchEvent(canvasSelector);
    else{
        if( utils.isTouchDevice() )
            this.bindTouchEvent(canvasSelector);

        this.bindMouseEvent(canvasSelector);
    }

    this.bindKeysEvent();
};

    bckMap.prototype.bindTouchEvent = function(canvasSelector){
        var self = this;

        this.wrp
                .on('touchstart', canvasSelector, function(e){
                    self.touchStart(e.originalEvent);
                })
                .on('touchmove', canvasSelector, function(e){
                    self.touchMove(e.originalEvent);
                })
                .on('touchend touchcancel', canvasSelector,function(e){
                    self.touchEnd(e.originalEvent);
                });
    };

    bckMap.prototype.bindMouseEvent = function(canvasSelector){
        var self = this;

        // Управление картой мышью
        this.wrp
            .on('mousedown', canvasSelector,  function(e){
                e.preventDefault();

                self.moveStart(e);
            })
            .on('mousemove', canvasSelector,  function(e){
                if( !self.firstChunksLoaded )
                    return false;

                // Перемещение области просмотра
                self.move(e);

                //блок-клик предотвращает нажатие после перемещения
                if( !self.blockClick )
                    self.hoverTracking(e);
            })
            .on('mouseup', canvasSelector,  function(e){
                self.moveStop();

                if( self.blockClick )
                    self.hoverTracking(e, {forceSet: true});
            })
            // Обрабатываем уход курсора с канваса. Обрабатывается, как уход на другой html элемент, так и уход за область экрана (mouseleave.once)
            .on('mouseout', canvasSelector,  function(e){
                self.removeTooltip();

                if( !self.map.isMoving ) return;

                self.map.cont.off('.once');

                if( e.relatedTarget || e.toElement ){	
                    self.map.cont.one('mouseup.once, mouseleave.once', function(){
                        if( self.map.isMoving )
                            self.moveStop();
                    });
                }
                else
                    self.moveStop();
            })
            .on('click', canvasSelector,  function(e){
                self.onMouseClick(e);
            })
            .on('mousewheel', canvasSelector, function(e){
                if( !wofh.platform.mouseScroll )
                    return;

                self.map.changeZoom(-e.deltaY);
            });
    };
    
    bckMap.prototype.bindKeysEvent = function(){
        $(window).off('.mapMove').on('keydown.mapMove', function(event) {
            var map = wndMgr.interface.map;

            var canMove = map instanceof bckMap && wndMgr.isEmpty(true, [TooltipWnd]);

            if( canMove ){
                if( event.target ){
                    var tagName = event.target.tagName.toLowerCase();

                    canMove = !(tagName == 'textarea' || tagName == 'input');
                }
            }

            if( !canMove )
                return;

            // Перемещение карты
            var disp;
            switch (event.which){
                case 33: disp = {x:1,	y:-1}; break;
                case 34: disp = {x:1,	y:1}; break;
                case 35: disp = {x:-1,	y:1}; break;
                case 36: disp = {x:-1,	y:-1}; break;
                case 37: disp = {x:-1,	y:0}; break;
                case 38: disp = {x:0,	y:-1}; break;
                case 39: disp = {x:1,	y:0}; break;
                case 40: disp = {x:0,	y:1}; break;
                default: disp = {x:0,	y:0};
            }
            if(disp.x != 0 || disp.y != 0){
                map.moveStep(disp.x, disp.y);

                return false;
            }
        });
    };

bckMap.prototype.beforeShowChildren = function(){
    //грузим список ресурсов
    this.createResMap();
    
    this.createResTime = timeMgr.getNow();
    
    //инициализация канваса
    this.canvasTag = this.wrp.find('#' + this.canvasId).get(0);
    this.canvas = this.canvasTag.getContext('2d');
    this.canvasWTag = this.wrp.find('#map-canvasW').get(0);
    this.canvasW = this.canvasWTag.getContext('2d');

    // Для маскирования тоннелей (не оптимально)
    this.canvasMaskTag = document.createElement('canvas');
    this.canvasMask = this.canvasMaskTag.getContext('2d');

    this.canvasMountMaskTag = document.createElement('canvas');
    this.canvasMountMask = this.canvasMountMaskTag.getContext('2d');

    this.canvasRoadTag = document.createElement('canvas');
    this.canvasRoadTag.width = Tile.sizePxArr[0].x + 40;
    this.canvasRoadTag.height = Tile.sizePxArr[0].y + 43;
    this.canvasRoad = this.canvasRoadTag.getContext('2d');
    this.canvasRoad.offset = {x: 20, y: 10};
        
//    var $canvasRoadTag = $(this.canvasRoadTag);
//
//    $canvasRoadTag.css({
//        position: 'absolute', 
//        top: 235, 
//        left: 20, 
//        'z-index': 100,
//        background: 'yellow'
//    });
//
//    this.wrp.find('.map-back').append($canvasRoadTag);

    //Инициализация тулбокса
    
    this.resize();

    this.posMWpx_draw = this.posMWpx;

    this.checkTileCache();
};

bckMap.prototype.getData = function(){
    var self = this;
    
    this.render = this.render.bind(this);

    //Находим - запоминаем координаты
    this.map.loadPosMWT();

    if( this.map.posMWT.o && this.map.posMWT.o != wofh.town.pos.o ){
        this.map.coorTransform(function(){
            self.dataReceived();
        });
    }
    else
        this.dataReceived();
};

bckMap.prototype.onRemove = function(){
    bckMap.superclass.onRemove.apply(this, arguments);

    delete this.canShowView;
};	


bckMap.prototype.setMap = function(parent){
    this.map = parent;
};

bckMap.prototype.init = function(){
    this.setMapCls();

    this.options.inactive = true;

    this.canvasId = 'map-canvas';

    //Идентификаторы перемещения карты
    this.lastMCoords;

    this.firstMCoords;

    this.resetBlockClick();

    //список загружавшихся чанков
    this.chunksLoading = [];
    this.chunksDisplayed = [];

    this.maxChunkUpload = 5; //максимум чанков, который одновременно отдаёт сервер
    this.chunksReqDelay = 3; // Время на которое увеличивается временой счетчик
    this.chunksReqDelayTime = 0; // Время на которое буде отложен запрос
    this.chunksReqLimitTime = 6; // Время превысив которое, будет отложен запрос

    this.tileWideArr = this.getTileWideArr();

    this.tileExtraWideArr = [
        {dispPx: {x: 0, y: 0}, sizePx: {x: 214,y: 214}},
        {dispPx: {x: 0, y: 0}, sizePx: {x: 107,y: 107}}
    ];

    //размер флага
    this.flag = {
        dispPx: {x: 120, y: this.getDispPx()}, //положение на тайле (без масштаба)
        sizePx: {x:21, y: 14}, //исходный размер 
        sizeDrawPx: {x:21, y: 14}, //отображаемый размер(без масштаба)
        hMin: 8 //минимальная отображаемая высота (с учётом масштаба)
    };

    //размер моста
    this.bridge = {
        dispDir:{x:20, y:10},
        dispRiver:{x:30, y:10},
        size: 34
    };

    //размер фильтра колонизации - почему то кривой...
    this.sizeClnFilter = {
        x: 980,//this.sizeTpx.x * 5,
        y: 490,//this.sizeTpx.y * 5,
        left: -4,
        top: 0
    };

    //размер фильтра улучшений
    this.sizeImpFilter = {
        x: 635,//this.sizeTpx.x * 5,
        y: 343//this.sizeTpx.y * 5,
    };

    //высота холмов (для дорог)
    this.hillHeight = 20;


    //Размер карты в тайлах
    this.sizeMT = {x: 480, y: 480};


    //Защита от слишком частого вызова апдейта карты
    this.lastMove = Date.now();

    //0 - очередь свободна, 1 - задача на выполеннии, 2 - после выполнения задачи запустить ещё одну
    this.waitList = 0;


    //Размер карты в пикселях
    this.sizeMpx = {
        x: this.sizeMT.x * Tile.sizePxArr[0].x,
        y: this.sizeMT.y * Tile.sizePxArr[0].y
    };

    //Итератор для moveStep()
    this.mSIter = -1;

    this.dispClimPx_y = 23;

    //this.cicadeSizes = [3,5,7,11];

    this.imgSets = this.getImgSets();

    // После изучения науки "образования", используется только один набор для климотов и холмов 
    this.simplifyImgSets();

    this.spriteSizes = {
        imp: 10,
        town: 3,
        hm: 4,
        hma: 2
    };

    /*
    this.imgSets = {
        c: 1,//климат
        cr: 1,//скругления климата
        c_dw: 1,//скругления глубокой воды
        hm: 1,
        mt: 4,
        dep: 10,
        imp: 20,
        impPack: 10,//сколько изображений в одном файле
        ures: 10
    }*/

    var filterLayersData = {
        mount: ['hm'],
        road: ['road','river_end'],
        city: ['townres','townres','wonder']
    };
    this.activeFilters = {
        list:[],
        layers:[]
    };

    //точки стыка мостов и дорог
    /*var bridgePoints = [
        {up:{x:0,y:-13}, down:{x:0,y:13}, control:1},
        {up:{x:-17,y:0}, down:{x:17,y:0}, control:7},
        {up:{x:-11,y:-11}, down:{x:9,y:9}, control:0},
        {up:{x:-11,y:11}, down:{x:9,y:-9}, control:2}
    ]*/

    this.fogCheckArr=[
        [0, 1],
        [4, 5],
        [1, 2],
        [5, 6],
        [0, 1, 2],
        [0, 1, 5, 6],
        [1, 2, 4, 5],
        [4, 5, 6],
        [1],
        [],
        [],
        [5]
    ];


    /*
          1-0
       0-1     2-3
    7-2     8-4     3-6
       6-5     4-7
          5-8
    */

    //индексация направлений связей городов и улучшений, берется от Tile.dirsScr
    this.dirsImpLink = [1, 0, 3, 6, 7, 8, 5, 2, 4];

    this.roadData = [
        {rand:5, iter:7, calcIter: true, draw:[/*река*/
            {type:'area-segm', img:1, r:10, rh: 5, rand: 6, y:2, view: 'perspective'}, //r-радиус, y-смещение по оси, view=perspective - сжатие по оси y
            {type:'area-segm', img:0, r:18, rh: 9, rand: 3, view: 'perspective', show: 'noZoom'},
            {type:'area-segm', img:2, r:14, rh: 7, rand: 3, view: 'perspective', show: 'noZoom'},
            {type:'area-segm', img:3, r:11, rh: 0, rand: 6, y:2, view: 'perspective', show: 'noZoom'}]},
        {rand:7, iter:10, calcIter: true, draw:[/*просёлок*/
            {type:'area-segm', img:0, r:3, rh: 2}, //сплайном
            {type:'area-segm', img:1, r:4, rh: 3, show: 'noZoom'}]},
        {rand:0, iter:7, calcIter: true, draw:[/*шоссе*/
            {type:'line', img:0}, 
            {type:'area-segm', img:1, r:7, rh: 5, show: 'noZoom'}]},
        {rand:0, iter:7, calcIter: true, draw:[/*жд*/
            {type:'line', img:0}, 
            {type:'area', img:1, x:-10, y:5, h:{x:-5, y:3}, show: 'noZoom'}, 
            {type:'area', img:1, x:10, y:5, h:{x:5, y:3}, show: 'noZoom'}]},
        {rand:0, iter:7, calcIter: true, draw:[/*маглев*/
            {type:'line', img:0, y:-10}, 
            {type:'area', img:1, x:0, y:-10, show: 'noZoom'}]},
        {rand:0, iter:7, calcIter: true, draw:[/*тоннель (отрисовка аналогична маглеву)*/
            {type:'line', img:0, y:-7}, 
            {type:'area', img:1, x:0, y:-7, r:5, rh: 2, rand: 10, show: 'noZoom'}]}
    ];

    this.roadLayers = [
        {type:0, step:1},//берег внешний
        {type:1, step:1},//обочина грунтовки
        {type:2, step:1},//обочина шоссе
        {type:3, step:1},//насыпь левая
        {type:3, step:2},//насыпь правая
        {type:1, step:0},//грунтовка
        {type:3, step:0},//жд
        {type:2, step:0},//шоссе
        {type:4, step:1},//опоры маглева
        {type:4, step:0},//маглев
        {type:5, step:1},//опоры тоннеля
        {type:5, step:0},//тоннель
        {type:0, step:2},//берег внутренний
        {type:0, step:3},//речная пена
        {type:0, step:0} //река
    ];

    this.roadAreaSteps = [
        [1,2,3], // Берег внешний, берег внутренний, речная пена
        [1], // Обочина грунтовки
        [1], // Обочина шоссе
        [1,2], // Левая насыпь ЖД, правая насыпь ЖД
        [1], // Опоры маглева
        [1] // Опоры тоннеля
    ];

    // Смещения для тоннельных дорог и арок для каждого направления
    this.tunnelDisp = {
        // Смещения для начальной и конечной точек отрисовки дороги
        road:	[
                    {x: 10, y: 5},
                    {x: 0, y: 10},
                    {x: -10, y: 5},
                    {x: -16, y: 0},
                    {x: -6, y: -3},
                    {x: 0, y: 0},
                    {x: 10, y: -5},
                    {x: 16, y: 0}
                ],
        // Смещения арок
        arch:	[
                    {x: -4, y: 2},
                    {x: 0, y: 0},
                    {x: -2, y: 0},
                    {x: 0, y: -1},
                    {x: 1, y: 0},
                    {x: 0, y: 0},
                    {x: -3, y: -1},
                    {x: 0, y: 0}
                ]
    };

    //масиив данных о диагональных скруглениях
    //norm - обычное скругление, соответствующее диагональному скруглению
    //dirs - заполненность в 9 точках (0-всегда пустота, 1-заполнено в основном, 2-заполнено в инверте, 3- заполнено в обоих)
    this.diagRounds = [
        {norm: 0,	h_dirs: [2,2,2,2,2,2,1,0,2], m_center:2},//center-1 8: 4.161.124
        {norm: 1,	h_dirs: [0,0,1,1,1,2,2,2,2], m_center:2},//[0,0,1,1,1,0,2,2,2] 5: 71.93
        {norm: 9,	h_dirs: [2,1,1,2,2,2,2,2,2], m_center:1},//[2,0,1,0,2,2,2,2,2] 7: 84.65
        {norm: 14,	h_dirs: [0,1,1,0,2,2,2,2,1], m_center:2},//[0,1,1,0,2,2,2,0,1] 6: 70.94
        {norm: 10,	h_dirs: [2,2,1,0,2,2,2,2,2], m_center:2},//2,0,1,0,2,2,2,2,2
        {norm: 14,	h_dirs: [2,1,1,1,2,2,2,2,2], m_center:1},

        {norm: 4,	h_dirs: [2,0,2,2,2,2,2,2,1], m_center:2},//[2,0,2,2,2,2,2,0,1] 3: 63.111
        {norm: 8,	h_dirs: [2,2,2,0,1,2,2,2,2], m_center:2},//[2,2,2,0,1,0,2,2,2] 1: 78.79
        {norm: 6,	h_dirs: [0,1,1,2,2,2,2,0,1], m_center:2},//[0,1,1,0,2,2,2,0,1] 2: 20.95
        {norm: 4,	h_dirs: [2,1,2,2,2,2,2,0,1], m_center:2},//1
        {norm: 4,	h_dirs: [2,0,2,2,2,2,2,0,1], m_center:2},//1
        {norm: 10,	h_dirs: [0,2,1,1,1,0,2,2,2], m_center:2},//[0,0,1,1,1,0,2,2,2] 0: 60.90
        {norm: 8,	h_dirs: [2,2,2,1,1,0,2,2,2], m_center:2},//[2,2,2,0,1,0,2,2,2] 4: 66.95
        {norm: 8,	h_dirs: [2,2,2,0,1,0,2,2,2], m_center:2},//1
    ];

    this.townSizeData = [
        [{x:-50, y:10},{x:-50, y:22},{x:0, y:32},{x:42, y:17},{x:35, y:10}],
        [{x:-55, y:10},{x:-50, y:25},{x:0, y:35},{x:47, y:20},{x:40, y:10}],
        [{x:-55, y:10},{x:-50, y:25},{x:0, y:35},{x:47, y:20},{x:40, y:10}],
        [{x:-65, y:10},{x:-55, y:27},{x:0, y:35},{x:47, y:20},{x:50, y:10}],
        [{x:-60, y:10},{x:-55, y:27},{x:0, y:42},{x:47, y:20},{x:47, y:10}],//5
        [{x:-60, y:10},{x:-50, y:25},{x:0, y:40},{x:47, y:20},{x:47, y:10}],
        [{x:-70, y:10},{x:-50, y:25},{x:0, y:40},{x:50, y:22},{x:40, y:10}],
        [{x:-72, y:10},{x:-50, y:25},{x:0, y:40},{x:47, y:20},{x:37, y:10}],
        [{x:-70, y:10},{x:-57, y:27},{x:0, y:45},{x:50, y:22},{x:37, y:10}],
        [{x:-75, y:10},{x:-57, y:27},{x:0, y:45},{x:50, y:25},{x:65, y:10}],//10
        [{x:-75, y:10},{x:-57, y:27},{x:0, y:45},{x:50, y:25},{x:62, y:10}],
        [{x:-75, y:10},{x:-57, y:27},{x:0, y:45},{x:50, y:25},{x:62, y:10}],
        [{x:-72, y:10},{x:-60, y:30},{x:0, y:45},{x:50, y:25},{x:62, y:10}],
        [{x:-72, y:10},{x:-57, y:27},{x:0, y:45},{x:50, y:25},{x:62, y:10}],
        [{x:-72, y:10},{x:-57, y:27},{x:0, y:45},{x:50, y:25},{x:62, y:10}],
    ];

    this.riverSpriteDisp = [
        {x:-4, y:-6},
        {x:0, y:-7},
        {x:6, y:-6},
        {x:+0, y:0},
        {x:9, y:0},
        {x:+0, y:0},
        {x:-7, y:-2},
        {x:+0, y:0}
    ];

    //смещения устьев: направление,откуда[8] - тип береговой линии[16+14] - набор
    this.riverMouthDisp = [
        {//СЗ
            4: [{x: 22, y: 10}, {x: 22, y: 10}, {x: 22, y: 10}, {x: 22, y: 10}],
            6: [{x: 22, y: 10}, {x: 22, y: 10}, {x: 22, y: 10}, {x: 22, y: 10}],
            12: [{x: 22, y: 10, s: 2}, {x: 22, y: 10, s: 2}, {x: 22, y: 10, s: 2}, {x: 22, y: 10, s: 2}],
            14: [{x: 30, y: 10}, {x: 30, y: 10}, {x: 30, y: 10}, {x: 30, y: 10}],
            17: [{x: 0, y: 0, s: 2}, {x: 0, y: 0, s: 2}, {x: 0, y: 0, s: 2}, {x: 0, y: 0, s: 2}],
            18: [{x: 0, y: 0, s: 2}, {x: 0, y: 0, s: 2}, {x: 0, y: 0, s: 2}, {x: 0, y: 0, s: 2}],
            19: [{x: 58, y: 5}, {x: 58, y: 5}, {x: 58, y: 5}, {x: 58, y: 5}],
            21: [{x: 5, y: -7, s: 2}, {x: 5, y: -7, s: 2}, {x: 5, y: -7, s: 2}, {x: 5, y: -7, s: 2}],
            22: [{x: 20, y: 10}, {x: 20, y: 10}, {x: 20, y: 10}, {x: 20, y: 10}],
            24: [{x: 42, y: 12}, {x: 42, y: 12}, {x: 42, y: 12}, {x: 42, y: 12}],
            25: [{x: 45, y: 15}, {x: 45, y: 15}, {x: 45, y: 15}, {x: 45, y: 15}],
            26: [{x: 30, y: 10, s: 1}, {x: 30, y: 10, s: 1}, {x: 30, y: 10, s: 1}, {x: 30, y: 10, s: 1}],
        },
        {//С
            2: [{x:0, y:30, s: 1}, {x:0, y:30, s: 1}, {x:0, y:30, s: 1}, {x:0, y:30, s: 1}],
            6: [{x:0, y:30, s: 1}, {x:0, y:30, s: 1}, {x:0, y:30, s: 1}, {x:0, y:30, s: 1}],
            10: [{x:0, y:28, s: 2}, {x:0, y:28, s: 2}, {x:0, y:28, s: 2}, {x:0, y:28, s: 2}],
            14: [{x:0, y:30}, {x:0, y:30}, {x:0, y:30}, {x:0, y:30}],
            16: [{x:0, y:-10}, {x:0, y:-10}, {x:0, y:-10}, {x:0, y:-10}],
            17: [{x:5, y:35}, {x:5, y:35}, {x:5, y:35}, {x:5, y:35}],
            18: [{x:7, y:33, s: 1}, {x:7, y:33, s: 1}, {x:7, y:33, s: 1}, {x:7, y:33, s: 1}],
            19: [{x:0, y:50}, {x:0, y:50}, {x:0, y:50}, {x:0, y:50}],
            20: [{x:0, y:30, s:2}, {x:0, y:30, s:2}, {x:0, y:30, s:2}, {x:0, y:30, s:2}],
            21: [{x:0, y:40}, {x:0, y:40}, {x:0, y:40}, {x:0, y:40}],
            24: [{x:0, y:25, s: 1}, {x:0, y:25, s: 1}, {x:0, y:25, s: 1}, {x:0, y:25, s: 1}],
            25: [{x:0, y:30}, {x:0, y:30}, {x:0, y:30}, {x:0, y:30}],
            27: [{x:-25, y:18, s: 2}, {x:-25, y:18, s: 2}, {x:-25, y:18, s: 2}, {x:-25, y:18, s: 2}],
        },
        {//СВ
            8: [{x: -25, y: 8, s: 1},{x: -25, y: 8, s: 1},{x: -25, y: 8, s: 1},{x: -25, y: 8, s: 1}],
            10: [{x: -30, y: 17},{x: -30, y: 17},{x: -30, y: 17},{x: -30, y: 17}],
            12: [{x: -30, y: 20},{x: -30, y: 20},{x: -30, y: 20},{x: -30, y: 20}],
            14: [{x: -30, y: 17},{x: -30, y: 17},{x: -30, y: 17},{x: -30, y: 17}],
            17: [{x: -35, y: 17},{x: -35, y: 17},{x: -35, y: 17},{x: -35, y: 17}],
            19: [{x: 20, y: -8, s: 1},{x: 20, y: -8, s: 1},{x: 20, y: -8, s: 1},{x: 20, y: -8, s: 1}],
            20: [{x: 20, y: -8, s: 1},{x: 20, y: -8, s: 1},{x: 20, y: -8, s: 1},{x: 20, y: -8, s: 1}],
            21: [{x: 20, y: -8, s: 1},{x: 20, y: -8, s: 1},{x: 20, y: -8, s: 1},{x: 20, y: -8, s: 1}],
            23: [{x: -25, y: 20},{x: -25, y: 20},{x: -25, y: 20},{x: -25, y: 20}],
            27: [{x: -45, y: 35},{x: -45, y: 35},{x: -45, y: 35},{x: -45, y: 35}],
            28: [{x: -40, y: 30},{x: -40, y: 30},{x: -40, y: 30},{x: -40, y: 30}],
            29: [{x: -23, y: 10, s: 2},{x: -23, y: 10, s: 2},{x: -23, y: 10, s: 2},{x: -23, y: 10, s: 2}],
        },
        {//В
            8: [{x: -85, y: 10},{x: -65, y: 10},{x: -85, y: 10},{x: -85, y: 10}],
            9: [{x: -68, y: 10, s: 2},{x: -68, y: 10, s: 2},{x: -68, y: 10, s: 2},{x: -68, y: 10, s: 2}],
            10: [{x: -45, y: 0, s: 1},{x: -45, y: 0, s: 1},{x: -45, y: 0, s: 1},{x: -45, y: 0, s: 1}],
            11: [{x: -95, y: 0},{x: -95, y: 0},{x: -95, y: 0},{x: -95, y: 0}],
            18: [{x: -55, y: 8, s: 2},{x: -55, y: 8, s: 2},{x: -55, y: 8, s: 2},{x: -55, y: 8, s: 2}],
            20: [{x: -50, y: -5, s: 1},{x: -50, y: -5, s: 1},{x: -50, y: -5, s: 1},{x: -50, y: -5, s: 1}],
            22: [{x: -125, y: 10},{x: -125, y: 10},{x: -125, y: 10},{x: -125, y: 10}],
            23: [{x: -30, y: 10},{x: -30, y: 10},{x: -30, y: 10},{x: -30, y: 10}],
            24: [{x: -70, y: 10, s: 2},{x: -70, y: 10, s: 2},{x: -70, y: 10, s: 2},{x: -70, y: 10, s: 2}],
            25: [{x: -90, y: 8, s: 2},{x: -90, y: 8},{x: -90, y: 8, s: 2},{x: -90, y: 8, s: 2}],
            26: [{x: -120, y: 8},{x: -135, y: 8},{x: -120, y: 8},{x: -120, y: 8}],
            27: [{x: -45, y: 17, s: 1},{x: -45, y: 17, s: 1},{x: -45, y: 17, s: 1},{x: -45, y: 17, s: 1}],
            28: [{x: -65, y: 10},{x: -65, y: 10},{x: -65, y: 10},{x: -65, y: 10}],
            29: [{x: -28, y: 17},{x: -28, y: 17},{x: -28, y: 17},{x: -28, y: 17}],
        },
        {//ЮВ
            1: [{x: -20, y: -22},{x: -20, y: -22},{x: -20, y: -22},{x: -20, y: -22}],
            3: [{x: -35, y: -20},{x: -35, y: -20},{x: -35, y: -20},{x: -35, y: -20}],
            9: [{x: -35, y: -20},{x: -35, y: -20},{x: -35, y: -20},{x: -35, y: -20}],
            11: [{x: -35, y: -22},{x: -35, y: -22},{x: -35, y: -22},{x: -35, y: -22}],
            17: [{x: -15, y: -7, s: 2},{x: -35, y: -20, s: 2},{x: -15, y: -7, s: 2},{x: -15, y: -7, s: 2}],
            18: [{x: -15, y: -7, s: 2},{x: -35, y: -20, s: 2},{x: -15, y: -7, s: 2},{x: -15, y: -7, s: 2}],
            19: [{x: -33, y: -15},{x: -33, y: -15},{x: -33, y: -15},{x: -33, y: -15}],
            21: [{x: -15, y: -7, s: 2},{x: -40, y: -20, s: 2},{x: -15, y: -7, s: 2},{x: -15, y: -7, s: 2}],
            25: [{x: -15, y: -13},{x: -15, y: -13},{x: -15, y: -13},{x: -15, y: -13}],
            22: [{x: -27, y: -25},{x: -27, y: -25, s: 1},{x: -27, y: -25},{x: -27, y: -25}],
            26: [{x: -27, y: -15, s: 1},{x: -27, y: -15, s: 1},{x: -27, y: -15, s: 1},{x: -27, y: -15, s: 1}],
            24: [{x: -20, y: -10},{x: -20, y: -10},{x: -20, y: -10},{x: -20, y: -10}],
        },
        {//Ю
            1: [{x: 0, y: -15},{x: 0, y: -15},{x: 0, y: -15},{x: 0, y: -15}],
            5: [{x: 10, y: -15, s: 2},{x: 10, y: -15, s: 2},{x: 10, y: -15, s: 2},{x: 10, y: -15, s: 2}],
            9: [{x: 0, y: -25, s: 1},{x: 0, y: -25, s: 1},{x: 0, y: -25, s: 1},{x: 0, y: -25, s: 1}],
            13: [{x: 0, y: -30},{x: 0, y: -30},{x: 0, y: -30},{x: 0, y: -30}],
            16: [{x: 0, y: -63},{x: 0, y: -63},{x: 0, y: -63},{x: 0, y: -63}],
            17: [{x: 0, y: -10}, {x: 0, y: -10}, {x: 0, y: -10}, {x: 0, y: -10}], 
            18: [{x: -5, y: -20, s: 1},{x: -5, y: -20, s: 1},{x: -5, y: -20, s: 1},{x: -5, y: -20, s: 1}],
            19: [{x: 0, y: -7},{x: 0, y: -7},{x: 0, y: -7},{x: 0, y: -7}],
            20: [{x: 0, y: -20, s: 2},{x: 0, y: -25, s: 2},{x: 0, y: -20, s: 2},{x: 0, y: -20, s: 2}],
            21: [{x: 0, y: -17},{x: 0, y: -17},{x: 0, y: -17},{x: 0, y: -17}],
            24: [{x: 0, y: -25, s: 1},{x: 0, y: -25, s: 1},{x: 0, y: -25, s: 1},{x: 0, y: -25, s: 1}],
            27: [{x: 0, y: 0, s: 2},{x: 0, y: -15, s: 2},{x: 0, y: 0, s: 2},{x: 0, y: 0, s: 2}],
        },
        {//ЮЗ
            1: [{x: 25, y: -12},{x: 25, y: -12},{x: 25, y: -12},{x: 25, y: -12}],
            3: [{x: 25, y: -12},{x: 25, y: -12},{x: 25, y: -12},{x: 25, y: -12}],
            5: [{x: 25, y: -12},{x: 25, y: -12},{x: 25, y: -12},{x: 25, y: -12}],
            7: [{x: 18, y: -15},{x: 18, y: -15},{x: 18, y: -15},{x: 18, y: -15}],
            17: [{x: 15, y: -15},{x: 15, y: -15},{x: 15, y: -15},{x: 15, y: -15}],
            19: [{x: 40, y: -20, s: 1},{x: 40, y: -20, s: 1},{x: 40, y: -20, s: 1},{x: 40, y: -20, s: 1}],
            20: [{x: 40, y: -20, s: 1},{x: 40, y: -20, s: 1},{x: 40, y: -20, s: 1},{x: 40, y: -20, s: 1}],
            21: [{x: 40, y: -20, s: 1},{x: 40, y: -20, s: 1},{x: 40, y: -20, s: 1},{x: 40, y: -20, s: 1}],
            23: [{x: 35, y: -10},{x: 35, y: -10},{x: 35, y: -10},{x: 35, y: -10}],
            27: [{x: 5, y: -12},{x: 5, y: -12},{x: 5, y: -12},{x: 5, y: -12}],
            28: [{x: 18, y: -25},{x: 18, y: -25},{x: 18, y: -25},{x: 18, y: -25}],
            29: [{x: 20, y: -10, s: 2},{x: 20, y: -10, s: 2},{x: 20, y: -10, s: 2},{x: 20, y: -10, s: 2}],
        },
        {//З
            4: [{x: 45, y: 0},{x: 60, y: 0},{x: 45, y: 0},{x: 45, y: 0}],
            5: [{x: 55, y: 0, s: 1},{x: 55, y: 0, s: 1},{x: 55, y: 0, s: 1},{x: 55, y: 0, s: 1}],
            6: [{x: 70, y: 0, s: 2},{x: 70, y: 0, s: 2},{x: 70, y: 0, s: 2},{x: 70, y: 0, s: 2}],
            7: [{x: 90, y: 3},{x: 90, y: 3},{x: 90, y: 3},{x: 90, y: 3}],
            18: [{x: 55, y: 0, s: 2},{x: 55, y: 0, s: 2},{x: 55, y: 0, s: 2},{x: 55, y: 0, s: 2}],
            20: [{x: 80, y: 13, s: 1},{x: 80, y: 13, s: 1},{x: 80, y: 13, s: 1},{x: 80, y: 13, s: 1}],
            22: [{x: 20, y: 12},{x: 20, y: 12},{x: 20, y: 12},{x: 20, y: 12}],
            23: [{x: 122, y: 10},{x: 122, y: 10},{x: 122, y: 10},{x: 122, y: 10}],
            24: [{x: 75, y: 0, s: 2},{x: 75, y: 0, s: 2},{x: 75, y: 0, s: 2},{x: 75, y: 0, s: 2}],
            25: [{x: 38, y: 10, s: 2},{x: 38, y: 10, s: 2},{x: 38, y: 10, s: 2},{x: 38, y: 10, s: 2}],
            26: [{x: 22, y: 8},{x: 22, y: 8},{x: 22, y: 8},{x: 22, y: 8}],
            27: [{x: 70, y: 10},{x: 80, y: 10, s: 1},{x: 70, y: 10},{x: 70, y: 10}],
            28: [{x: 97, y: 7},{x: 100, y: 7, s: 1},{x: 97, y: 7},{x: 97, y: 7}],
            29: [{x: 120, y: 10},{x: 120, y: 10},{x: 120, y: 10},{x: 120, y: 10}],
        }
    ];

    this.zoomPicLevels = [0, 1];// начиная с какого уровня грузятся какие изображения

    this.zoomPicLevel = 0;

    //шаблон слоёв
    this.layersBlank_res = {};

    this.layersBlank_tile = {};

    //паттерны для отрисовки
    this.patterns = {};

    //загруженные флаги
    this.flagImgs = {};

    //список отображенных в данный момент чанков
    this.chunksShown = [];

    this.depLinks = {};

    //число комментариев в тултипе
    this.tooltipCommentCount = 3;

    // Раскраска маршрута
    this.routeColors = {
        land: ['blue', '#00d440', 'yellow', 'orange', 'red'],
        water: ['lightblue', 'blue'],
        tunnel: 'black',
        fog: 'transparent'
    };
};
    
    bckMap.prototype.setMapCls = function(){
        wndMgr.$body.toggleClass('-simplifiedMap', false);
    };
    
    bckMap.prototype.getDrawBaseDispClimPx_y = function(){
        return this.dispClimPx_y;
    };
    
    bckMap.prototype.getTileWideArr = function(){
        return [
            {dispPx: {x: 0, y: -73}, sizePx: {x: 194,y: 194}},
            {dispPx: {x: 0, y: -36}, sizePx: {x: 98,y: 98}}
        ];
    };

    bckMap.prototype.getDispPx = function(){
        return 40;
    };

    bckMap.prototype.getImgSets = function(){
        return {
            c: 3, // Климат
            cr: 3, // Скругления климата
            c_dw: 3, // Скругления глубокой воды
            h: 2,
            m: 2,
            mt: 4,
            dep: 10,
            imp: 20,
            ures: 10,
            fog: 3
        };
    };
    
    bckMap.prototype.simplifyImgSets = function(){
        if( !Science.get(Science.ids.education).isKnown() )
            return;

        this.imgSets.c = 1;
        this.imgSets.cr = 1;
        this.imgSets.c_dw = 1;
        this.imgSets.h = 1;
    };


bckMap.prototype.touchStart = function(e){
    this.handleTouchEvent(e);
    
    this.firstMCoords = {
        pageX: e.touches[0].pageX, 
        pageY: e.touches[0].pageY
    };

    this.saveLastMCoords(e.touches[0]);
};

bckMap.prototype.touchMove = function(e){
    this.handleTouchEvent(e);

    this.move(e.touches[0]);
};

bckMap.prototype.touchEnd = function(e){
    this.handleTouchEvent(e);

    if( this.lastMCoords ){
        this.onTouchEndHoverTracking();

        this.onMouseClick(this.lastMCoords);
    }

    if( this.map.isMoving )
        this.moveStop();
};

    bckMap.prototype.handleTouchEvent = function(e){
        e.preventDefault();
    };
    
    bckMap.prototype.onTouchEndHoverTracking = function(){
        this.hoverTracking(this.lastMCoords, {
            forceSet: true, 
            noTooltip: this.map.isMoving || this.blockClick
        });
    };

/**
* Перемещение карты
*
* @param event e - событие перемещения мышью.
*/

bckMap.prototype.moveStart = function(e){
    this.map.toggleMove(true);

    // Перемещение области просмотра
    this.firstMCoords = e;
    this.lastMCoords = e;
};

bckMap.prototype.move = function(e){
    if( !this.lastMCoords )
        return;

    this.mapStartMoving();

    // Блокировка на клик - чтобы не сработал по окончании перемещения
    if( this.detectMovement() ){
        if( Math.abs(this.lastMCoords.pageX-this.firstMCoords.pageX)>5 || Math.abs(this.lastMCoords.pageY-this.firstMCoords.pageY)>5 ){
            this.beforeMove(e);

            this.setBlockClick(true);

            this.map.toggleMove(true);
        }
        else{
            this.saveLastMCoords(e);

            return;
        }
    }

    // Позиционирование карты
    this.setPosMWpx(this.calcNewPosMWpx(e));

    this.showView();

    //запоминаем координаты мыши
    this.saveLastMCoords(e);

    this.calcPosMWT();
};

    bckMap.prototype.calcNewPosMWpx = function(e){
        return {
            x: Math.round(this.posMWpx.x + (e.pageX - this.lastMCoords.pageX) * this.map.zoom),
            y: Math.round(this.posMWpx.y + (e.pageY - this.lastMCoords.pageY) * this.map.zoom)
        };
    };

    bckMap.prototype.detectMovement = function(){
        return !this.map.isMoving || !this.blockClick;
    };

    bckMap.prototype.beforeMove = function(e){};

bckMap.prototype.moveStop = function(){
    this.requestRender();

    this.clearLastMCoords();

    this.map.toggleMove(false);

    if( debug.useMapRoadsCacheInWorker() )
        iMap.compressRoadsCache();

    notifMgr.runEvent(Notif.ids.mapMove);
};


bckMap.prototype.saveLastMCoords = function(e){
    this.lastMCoords = {pageX: e.pageX, pageY: e.pageY};
};

bckMap.prototype.clearLastMCoords = function(e){
    delete this.lastMCoords;
};

bckMap.prototype.setBlockClick = function(state){
    this.blockClick = state||false;
};

bckMap.prototype.resetBlockClick = function(){
    this.setBlockClick(false);
};

bckMap.prototype.hoverTracking = function(e, opt){
    opt = opt||{};

    if( this.setTileHover(e, opt.forceSet) ){
        this.drawHighCanvas();

        if( opt.onlyDraw )
            return;

        // Режимы
        this.showModalHover();

        if( !opt.noTooltip )
            this.showTooltip();

        notifMgr.runEvent(Notif.ids.mapTileHover);
    }
};

bckMap.prototype.onMouseClick = function(e){
    if( this.blockClick ){
        this.resetBlockClick();

        return false;
    }

    var posTMT = this.getPosTMTByMouse(e);

    this.onClickTile(this.map.getTile(posTMT));
};


bckMap.prototype.createResMap = function(){
    this.tRes = [];
    this.resLoaded = [];

    //доступные к загрузке ресурсы
    for(var zoom = 0; zoom < this.zoomPicLevels.length; zoom++){
        var picPath = 'https://test.waysofhistory.com/img/map1/',
            picPathGui = 'https://test.waysofhistory.com/img/gui/map2/',
            zoomSuff = zoom == 0 ? '100' : '50',
            size = zoom == 0 ? 100 : 50;

        this.patterns[zoom] = {};

        var list = {
            c:{}, cr:{}, hm: {}, 
            imp1:{}, road: {}, river_end: {}, 
            resStack:{}, townres: {}, wonder: {}, 
            pike: {}, pike_road: {}, road_joints: {}, 
            clear: {}, focus: {}, road_bld: {}, 
            env_bld: {}, env_ph: {}
        };

        this.tRes.push(list);

        for(var set = 0; set < this.imgSets.cr; set++){
            //климат базовый
            list.c[set] = {url: picPath+'climate-'+zoomSuff+'/'+set+'/_.png'};
            //климат глубоководные скругления
            list.cr['dw'+set+'_0'] = {url: picPath+'climate-'+zoomSuff+'/'+set+'/dw_0.png'}; // Для одного слоя графики
            list.cr['dw'+set+'_1'] = {url: picPath+'climate-'+zoomSuff+'/'+set+'/dw_1.png'}; // Для нескольких слоев графики (рисуется поверх)
        }

        //климат скругления
        function createSprite(sign, set, first, last, bckMap){
            for(var sprite = first; sprite <= last; sprite++){
                for(var row = 0; row < 5; row++){
                    var gen = false;

                    list.cr[''+sign+sprite+set+'_'+row] = gen ? {gen: gen} : {url: picPath+'climate-'+zoomSuff+'/'+set+'/'+sign+sprite+'_'+row+'.png'};
                }
            }
        };

        for(var set = 0; set < this.imgSets.cr; set++){
            createSprite('0', set, 0, 4, this);
            createSprite('1', set, 0, 0, this);
            createSprite('a', set, 1, 2, this);
            createSprite('b', set, 1, 2, this);
            createSprite('c', set, 1, 5, this);
            createSprite('d', set, 1, 4, this);
        }
        createSprite('1', 0, 0, 1, this);
        createSprite('1', 0, 0, 2, this);
        createSprite('1', 0, 0, 3, this);
        createSprite('1', 0, 0, 4, this);
        createSprite('a', 0, 1, 3, this);
        createSprite('b', 0, 1, 3, this);

        var mapImpList = MapImp.getAll().getSortList('getMapZ', true).getList();

        for(var imp in mapImpList){
            imp = +mapImpList[imp].getId();

            list['imp'+imp] = {};

            var impPath = picPath+'improvement-'+zoomSuff+'/'+'improvement_';

            for (var level = 1; level <= 3; level++){
                if (imp == MapImp.ids.bridge || imp == MapImp.ids.riverProd){
                    list['imp'+imp]['env'+imp+'_'+level] = {url: impPath+imp+'_s_'+level+'_0.png', type: 'bridge', imgcls: 'imp'};
                } else if (imp == MapImp.ids.culture){
                    for (var climate = 2; climate <= 5; climate++){
                        list['imp'+imp]['env'+imp+'_0'+climate+level] = {url: impPath+imp+'_a_'+level+'_'+climate+'.png', addDisp: {x:0, y: -this.dispClimPx_y}, imgcls: 'imp'};
                        list['imp'+imp]['env'+imp+'_1'+climate+level] = {url: impPath+imp+'_b_'+level+'_'+climate+'.png', addDisp: {x:0, y: -this.dispClimPx_y}, imgcls: 'imp'};
                        list['imp'+imp]['env'+imp+'_r'+climate+level] = {url: impPath+imp+'_s_'+level+'_'+climate+'.png', type: 'wide', addDisp: {x:0, y:-2*this.dispClimPx_y}, imgcls: 'imp'};
                    }
                } else if (imp == MapImp.ids.waterProd || imp == MapImp.ids.knowledgeWater || imp == MapImp.ids.skiResort){
                    list['imp'+imp]['env'+imp+'_0'+level] = {url: impPath+imp+'_a_'+level+'_0.png', addDisp: {x:0, y: this.dispClimPx_y}, imgcls: 'imp'};
                    list['imp'+imp]['env'+imp+'_1'+level] = {url: impPath+imp+'_b_'+level+'_0.png', addDisp: {x:0, y: this.dispClimPx_y}, imgcls: 'imp'};
                } else {
                    list['imp'+imp]['env'+imp+'_0'+level] = {url: impPath+imp+'_a_'+level+'_0.png', addDisp: {x:0, y:-this.dispClimPx_y}, imgcls: 'imp'};
                    list['imp'+imp]['env'+imp+'_1'+level] = {url: impPath+imp+'_b_'+level+'_0.png', addDisp: {x:0, y:-this.dispClimPx_y}, imgcls: 'imp'}; 
                    list['imp'+imp]['env'+imp+'_r'+level] = {url: impPath+imp+'_s_'+level+'_0.png', type: 'wide', addDisp: {x:0, y:-2*this.dispClimPx_y}, imgcls: 'imp'};
                }
            }
        }

        if( debug.isImpKit() ){
            for(var impKitList in mapImpList){
                impKitList = +mapImpList[impKitList].getId();
                impKitList = list['imp'+impKitList];

                for(var impKit in impKitList){
                    impKit = impKitList[impKit];

                    if( impKit.type == 'bridge' )
                        continue;

                    if( /_a_|_b_/.test(impKit.url) )
                        impKit.url = impPath+'a_b_kit.png';
                    else if( /_s_/.test(impKit.url) )
                        impKit.url = impPath+'s_kit.png';
                }
            }
        }

        // Слой тумана
        list.fog = {};

        //дороги
        var roadPath = picPath+'road-'+zoomSuff+'/'+'road_';

        list.road = this.createResRoads(roadPath, {asphalt: Science.get(Science.ids.chemistry).isKnown()});

        // Горы и холмы
        for(var set = 0; set < this.imgSets.h; set++){				
            for(var i=0; i<4; i++){
                for(var clim=0; clim<utils.sizeOf(Tile.climate)-2; clim++){
                    list.hm['h'+clim+i+'_'+set] = {url: picPath+'hill_mountain-'+zoomSuff+'/hm'+set+'/h'+clim+i+'.png', type: 'wide', subtype: 'upper', imgcls: 'hill'};
                }
            }
            for(var i=0; i<7; i++){
                for(var clim=0; clim<utils.sizeOf(Tile.climate)-2; clim++){
                    list.hm['ha'+clim+i+'_'+set] = {url: picPath+'hill_mountain-'+zoomSuff+'/hm'+set+'/ha'+clim+i+'.png', type: 'wide', subtype: 'upper', imgcls: 'hill'};
                }
            }
        }

        for(var set = 0; set < this.imgSets.m; set++){				
            for(var i=0; i<4; i++){
                for(var clim=0; clim<utils.sizeOf(Tile.climate)-2; clim++){
                    list.hm['m'+clim+i+'_'+set] = {url: picPath+'hill_mountain-'+zoomSuff+'/hm'+set+'/m'+clim+i+'.png', type: 'wide', subtype: 'upper', imgcls: 'mount'};
                    list.pike['m'+clim+i+'_'+set] = {url: picPath+'hill_mountain-'+zoomSuff+'/hm'+set+'/m'+clim+i+'.png', type: 'wide', subtype: 'upper', imgcls: 'mount'};
                }
            }

            for(var i=0; i<7; i++){
                for(var clim=0; clim<utils.sizeOf(Tile.climate)-2; clim++){
                    list.hm['ma'+clim+i+'_'+set] = {url: picPath+'hill_mountain-'+zoomSuff+'/hm'+set+'/ma'+clim+i+'.png', type: 'wide', subtype: 'upper', imgcls: 'mount'};
                    list.pike['ma'+clim+i+'_'+set] = {url: picPath+'hill_mountain-'+zoomSuff+'/hm'+set+'/ma'+clim+i+'.png', type: 'wide', subtype: 'upper', imgcls: 'mount'};
                }
            }

            var leters = ['', '_1a', '_2a'];
            for(var i = 0; i<leters.length; i++){
                var leter = leters[i];
                for(var clim=0; clim<utils.sizeOf(Tile.climate)-2; clim++){
                    list.pike['m'+leter+clim+'_'+set] = {url: picPath+'hill_mountain-'+zoomSuff+'/'+set+'/m'+clim+leter+'.png', type: 'wide', subtype: 'upper', imgcls: 'mount'};
                }
            }
        }

        list.pike.mt1 = {url: picPath+'hill_mountain-'+zoomSuff+'/m0.png', type: 'wide', subtype: 'upper', imgcls: 'mount'};
        list.pike.mt2 = {url: picPath+'hill_mountain-'+zoomSuff+'/m1.png', type: 'wide', subtype: 'upper', imgcls: 'mount'};
        list.pike.mt3 = {url: picPath+'hill_mountain-'+zoomSuff+'/m2.png', type: 'wide', subtype: 'upper', imgcls: 'mount'};
        list.pike.mt4 = {url: picPath+'hill_mountain-'+zoomSuff+'/m3.png', type: 'wide', subtype: 'upper', imgcls: 'mount'};

        // Горная дорога (Тоннель/ЖД). Данный слой рисуется поверх гор
        list.pike_road[5] = {url: [roadPath+'6_1_a.png', roadPath+'6_2_a.png'], type: 'road', roadType: 5, pattern: true, imgcls: 'road'};

        list.road_joints.tunnel_arches = {url: roadPath+'6_j_a.png', type: 'wide', imgcls: 'road'};

        //устья и истоки
        var riverPath = picPath+'river-'+zoomSuff+'/';

        list.river_end = {
            source2: {url: riverPath+'riversource_2-0.png', type: 'extrawide'},
            source3: {url: riverPath+'riversource_3-0.png', type: 'extrawide'},
            source4: {url: riverPath+'riversource_4-0.png', type: 'extrawide'},
            source5: {url: riverPath+'riversource_5-0.png', type: 'extrawide'},
        };

        for(var clim = 2; clim < utils.sizeOf(Tile.climate); clim++){
            for(var dir=0; dir<Tile.dirsMap.length; dir++){
                list.river_end['mouth'+clim+dir] = {url: riverPath+'rivermouth_'+clim+'-'+dir+'.png', type: 'wide'};
            }
        }

        //города
        for(var level=0; level<this.townSizeData.length; level++){
            for(var relation=0; relation<=5; relation++){
                for(var wonder=0; wonder<=1; wonder++){
                    list.townres['town_'+level+'_'+relation+'_'+wonder] = {url: picPath+'town-'+zoomSuff+'/town_'+utils.twoDigits(level)+'_'+relation+'_'+wonder+'.png', type: 'wide', imgcls: 'town'};
                }
            }
        }

        //города - чудеса
        for(var wonder in WonderEffect.builds){
            list.wonder[wonder] = {url: picPath+'wonder-'+zoomSuff+'/wonder_'+wonder+'.png', type: 'wide', imgcls: 'town', imgcls2: 'wonder'};
        }

        //ресурсы стыкующиеся
        var resPath = picPath+'resource-'+zoomSuff+'/';
        var event = 0;

        if( wofh.gameEvent.has(GameEvent.ids.newYearReady) )
            event = 2;	

        list.resStack.res_00a = {url: resPath+'resource_00_s_'+event+'_0-0.png', type: 'wide', imgcls: 'res', imgcls2: 'known', imgcls3: 'stack'};
        list.resStack.res_01a = {url: resPath+'resource_01_s_'+event+'_0-0.png', type: 'wide', imgcls: 'res', imgcls2: 'known', imgcls3: 'stack'};
        list.resStack.res_02a = {url: resPath+'resource_02_s_'+event+'_0-0.png', type: 'wide', imgcls: 'res', imgcls2: 'known', imgcls3: 'stack'};

        //ресурсы неизвестные
        for(var clim=1; clim <= utils.sizeOf(Tile.climate); clim++){
            for(var res=0; res<this.imgSets.ures; res++){
                var undfEvent = wofh.gameEvent.has(GameEvent.ids.helloween)? 1: event;

                if (clim == Tile.climateIds.water) {
                    for(var clim2=2; clim2 <= utils.sizeOf(Tile.climate); clim2++){
                        list.townres['res_u'+clim+clim2+res] = {url:resPath+'resource_'+utils.twoDigits(60+clim)+'_'+clim2+'_'+undfEvent+'_'+clim+'-'+res+'.png', type: 'wide', imgcls: 'res', imgcls2: 'unknown'};		
                    }
                } else {
                    list.townres['res_u'+clim+res] = {url:resPath+'resource_'+utils.twoDigits(60+clim)+'_a_'+undfEvent+'_'+clim+'-'+res+'.png', type: 'wide', imgcls: 'res', imgcls2: 'unknown'};	
                }
            }
        }
        //ресурсы известные 
        list.townres.res_00b = {url: resPath+'resource_00_b_'+event+'_0-0.png', type: 'wide', imgcls: 'res', imgcls2: 'known', imgcls3: 'stack'};
        list.townres.res_01b = {url: resPath+'resource_01_b_'+event+'_0-0.png', type: 'wide', imgcls: 'res', imgcls2: 'known', imgcls3: 'stack'};
        list.townres.res_02b = {url: resPath+'resource_02_b_'+event+'_0-0.png', type: 'wide', imgcls: 'res', imgcls2: 'known', imgcls3: 'stack'};
        for(var res=0; res< lib.map.deposit.length-1; res++){
            var num = utils.twoDigits(res);

            list.townres['res_'+num] = {url: resPath+'resource_'+num+'_a_'+event+'_0-0.png', type: 'wide', imgcls: 'res', imgcls2: 'known'};
        }

        //строящиеся улучшения и города
        list.env_bld = {};
        list.env_bld.town = {url: picPath+'town-'+zoomSuff+'/town_01_p_0.png'};

        for(var imp in mapImpList){
            imp = +mapImpList[imp].getId();

            var impPath = picPath+'improvement-'+zoomSuff+'/'+'improvement_';
            for (var level = 1; level <= 3; level++){
                if (imp == MapImp.ids.culture) {
                    for (var climate = 2; climate <= 5; climate++){
                        list.env_bld['env'+imp+'_'+climate+level] = {url: impPath+imp+'_p_'+level+'_'+climate+'.png'};
                    }
                } else {
                    list.env_bld['env'+imp+'_'+level] = {url: impPath+imp+'_p_'+level+'_0.png'};
                }
            }
        }

        //строящиеся МР
        var resPath = picPath+'resource-'+zoomSuff+'/';
        for(var res=0; res< lib.map.deposit.length-1; res++){
            list.env_bld['res_'+utils.twoDigits(res)] = {url: resPath+'resource_'+utils.twoDigits(res)+'_p_0_0-0.png', type: 'wide', imgcls: 'res', imgcls2: 'known'};
        }
        //сетки
        list.grid = {
            cln: {url: picPathGui+'fltr_colonizing-'+zoomSuff+'.png', addDisp: {x: 0, y: this.dispClimPx_y}},
            imp: {url: picPathGui+'fltr_impmap-'+zoomSuff+'.png', addDisp: {x: 0, y: this.dispClimPx_y}},
            grd: {url: picPathGui+'net-'+zoomSuff+'.png', addDisp: {x: 0, y: this.dispClimPx_y}}, 
        };

        // Туман
        var fogType = wofh.account.isAdmin() ? 2 : 1;

        for(var set = 0; set < this.imgSets.fog; set++){
            // Используем один набор для зума в 50 или админа
            list.fog[set] = {url: picPath+'fog' + fogType + '-' + (zoomSuff == '50' || fogType == 2 ? 0 : set) + '-' + zoomSuff + '.png'};
        }

        //все флаги в одном объекте
        list.flag = {}; 

        if( zoom > 0 )
            list.flag = this.tRes[0].flag;

        //отчистка области видимости
        list.clear.base = {url: [], type: 'clear'};

        //слой анимации

        //фокус
        list.focus[0] = {url: picPathGui+'focus-'+zoomSuff+'.png'};

        //строящиеся дороги
        var roadPath = picPath+'road-'+zoomSuff;
        list.road_bld = {};
        list.road_bld[1] = {url: [roadPath+'/road_1_1_p.png', roadPath+'/road_1_2_p.png'], type: 'road', roadType: 1, pattern: true};

        if( !Science.get(Science.ids.chemistry).isKnown() )
            list.road_bld[2] = {url: [roadPath+'/road_2_1_p.png', roadPath+'/road_2_2_p.png'], type: 'road', roadType: 2, pattern: true};
        else
            list.road_bld[2] = {url: [roadPath+'/road_3_1_p.png', roadPath+'/road_3_2_p.png'], type: 'road', roadType: 2, pattern: true};

        list.road_bld[3] = {url: [roadPath+'/road_4_1_p.png', roadPath+'/road_4_2_p.png'], type: 'road', roadType: 3, pattern: true};
        list.road_bld[4] = {url: [roadPath+'/road_5_1_p.png', roadPath+'/road_5_2_p.png'], type: 'road', roadType: 4, pattern: true};

        list.road_bld[5] = {url: [roadPath+'/road_6_1_p.png', roadPath+'/road_6_2_p.png'], type: 'road', roadType: 5, pattern: true};
        list.road_bld.tunnel_arches = {url: roadPath+'/road_6_j_p.png', type: 'wide', imgcls: 'road'};

        //фантомные улучшения - рабочие уже отправлены на строительство, но событие постройки ещё не произошло
        list.env_ph.town = {url: picPath+'town-'+zoomSuff+'/town_01_f_0.png'};
        list.env_ph.explore = {url: 'https://test.waysofhistory.com/img/gui/buttons/buttons_type2-a-1.png'};

        var resPath = picPath+'resource-'+zoomSuff+'/';
        for(var res=0; res< lib.map.deposit.length-1; res++){
            list.env_ph['res_'+utils.twoDigits(res)] = {url: resPath+'resource_'+utils.twoDigits(res)+'_f_0_0-0.png', type: 'wide', imgcls: 'res', imgcls2: 'known'};
        }

        for (var imp in mapImpList){
            imp = +mapImpList[imp].getId();

            var impPath = picPath+'improvement-'+zoomSuff+'/'+'improvement_';

            for (var level = 1; level <= 3; level++){
                if (imp == MapImp.ids.culture) {
                    for (var climate = 2; climate <= 5; climate++){
                        list.env_ph['env'+imp+'_'+climate+level] = {url: impPath+imp+'_f_'+level+'_'+climate+'.png'};
                    }
                } else {
                    list.env_ph['env'+imp+'_'+level] = {url: impPath+imp+'_f_'+level+'_0.png'};
                }
            }
        }

        var roadPath = picPath+'road-'+zoomSuff;
        list.env_ph[1] = {url: [roadPath+'/road_1_1_f.png', roadPath+'/road_1_2_f.png'], type: 'road', roadType: 1, pattern: true};

        if (!Science.get(Science.ids.chemistry).isKnown()){
            list.env_ph[2] = {url: [roadPath+'/road_2_1_f.png', roadPath+'/road_2_2_f.png'], type: 'road', roadType: 2, pattern: true};
        } else {
            list.env_ph[2] = {url: [roadPath+'/road_3_1_f.png', roadPath+'/road_3_2_f.png'], type: 'road', roadType: 2, pattern: true};
        }

        list.env_ph[3] = {url: [roadPath+'/road_4_1_f.png', roadPath+'/road_4_2_f.png'], type: 'road', roadType: 3, pattern: true};
        list.env_ph[4] = {url: [roadPath+'/road_5_1_f.png', roadPath+'/road_5_2_f.png'], type: 'road', roadType: 4, pattern: true};

        list.env_ph[5] = {url: [roadPath+'/road_6_1_f.png', roadPath+'/road_6_2_f.png'], type: 'road', roadType: 5, pattern: true};	
        list.env_ph.tunnel_arches = {url: roadPath+'/road_6_j_f.png', type: 'wide', imgcls: 'road'};

        //линии связей улучшений
        list.env_links = {
            link: {url: picPathGui+'improvement_links_lines-'+size+'.png'},
            border: {url: picPathGui+'improvement_links_border-'+size+'.png'}
        };

        //загруженные ресурсы
        var listLoaded = {};
        for(var layerName in list){
            listLoaded[layerName] = {};
            this.layersBlank_tile[layerName] = [];
            this.layersBlank_res[layerName] = [];
            for(var resName in list[layerName]){
                listLoaded[layerName][resName] = false;
            }
        }

        this.resLoaded.push(listLoaded);
    }
};

bckMap.prototype.createResRoads = function(roadPath, opt){
    opt = opt||{};

    var roads = {
        0: {url: [roadPath+'0_1_a.png', roadPath+'0_2_a.png', roadPath+'0_3_a.png', roadPath+'0_4_a.png'], type: 'road', roadType: 0, pattern: true},
        1: {url: [roadPath+'1_1_a.png', roadPath+'1_2_a.png'], type: 'road', roadType: 1, pattern: true, imgcls: 'road'},
        3: {url: [roadPath+'4_1_a.png', roadPath+'4_2_a.png'], type: 'road', roadType: 3, pattern: true, imgcls: 'road'},
        4: {url: [roadPath+'5_1_a.png', roadPath+'5_2_a.png'], type: 'road', roadType: 4, pattern: true, imgcls: 'road'}
    };

    if( opt.asphalt )
        roads[2] = {url: [roadPath+'3_1_a.png', roadPath+'3_2_a.png'], type: 'road', roadType: 2, pattern: true, imgcls: 'road'};
    else
        roads[2] = {url: [roadPath+'2_1_a.png', roadPath+'2_2_a.png'], type: 'road', roadType: 2, pattern: true, imgcls: 'road'};

    return roads;
};

bckMap.prototype.getPosTMTByMPx = function(posMpx){
    var dispMWT = { //смещение центра области отрисовки в полутайлах
        x: posMpx.x / (Tile.sizePxArr[0].x + 2) * 2,
        y: posMpx.y / Tile.sizePxArr[0].y * 2
    };

    var posMWT = {
        x: Math.floor((dispMWT.x + dispMWT.y) / 2),
        y: Math.floor((dispMWT.y - dispMWT.x) / 2)
    };

    return posMWT;
};

bckMap.prototype.getPosTMTByMouse = function(mouse){
    var mousePos = this.getMousePos(mouse);
    
    return this.getPosTMTByMPx({
        x: -this.posMWpx.x + (mousePos.x) * this.map.zoom, 
        y: -this.posMWpx.y + (mousePos.y) * this.map.zoom + this.dispClimPx_y * this.getDispClimPxMult()
    });
};

    bckMap.prototype.getDispClimPxMult = function(){
        return 1;
    };

bckMap.prototype.getMousePos = function(mouse){
    return {x: mouse.pageX, y: mouse.pageY};
};

bckMap.prototype.generateStyles = function(chunk){
    var left = chunk.posCMT.x-1,
        top = chunk.posCMT.y-1,
        right = left+Chunk.sizeT.x+1,
        bottom = top+Chunk.sizeT.y+1;

    //расчёт устьев рек(необходим для расчёта самих рек) 
    for(var x = left; x <= right; x++){
        for(var y = top; y <= bottom; y++){
            var tile = this.map.getTile({x: x, y: y});

            if( !tile || tile.length == 0 ) continue;

            // Тайл смежного чанка (если окрестные тайлы изменились, перегинерируем тайл)
            if( x == left || y == top || x == right || y == bottom ){
                tile[Tile.param.boundary] = true;

                var tileNext,
                    ambitCoors,
                    actual = tile[Tile.param.actual] === undefined ? true : tile[Tile.param.actual];

                if( actual ){
                    if( x == left )
                        ambitCoors = [{x: x+1, y: y}, {x: x+1, y: y+1}, {x: x+1, y: y-1}];
                    else if( y == top )
                        ambitCoors = [{x: x, y: y+1}, {x: x+1, y: y+1}, {x: x-1, y: y+1}];
                    else if( x == right )
                        ambitCoors = [{x: x-1, y: y}, {x: x-1, y: y+1}, {x: x-1, y: y-1}];
                    else if( y == bottom )
                        ambitCoors = [{x: x, y: y-1}, {x: x+1, y: y-1}, {x: x-1, y: y-1}];

                    for(var i in ambitCoors){
                        tileNext = this.map.getTile(ambitCoors[i], chunk);

                        actual = !tileNext || tileNext[Tile.param.actual];

                        if( !actual )
                            break;
                    }

                    tile[Tile.param.actual] = actual;
                }
            }

            if( tile[Tile.param.actual] )
                continue;
            
            this.calcRiverEnds(tile);
        }
    }

    //основной расчёт стилей
    for(var x = left; x <= right; x++){
        for(var y = top; y <= bottom; y++){
            var tile = this.map.getTile({x: x, y: y});

            if( !tile || tile.length == 0 ) continue;

            if( tile[Tile.param.actual] )
                continue;

            this.generateStyle(tile);
        }
    }

    // Расчет границ карты
    this.generateEdges();
};

bckMap.prototype.cacheRoads = function(){};

bckMap.prototype.generateStyle = function(tile){
    tile[Tile.param.layersUpd] = 0;

    //есть тайлы с одним только туманом - их не пересчитываем
    if( utils.sizeOf(tile[Tile.param.layers]) == 1 && tile[Tile.param.layers].fog ) 
        return;

    //корректируем рельеф: 
    if( tile[Tile.param.dep] != lib.map.nodeposit || tile[Tile.param.climate] == Tile.climateIds.water )
        tile[Tile.param.terrain] = -1;

    //т.к. из-за улучшений у нас работает пересчёт граничных тайлов, то слои в тайле обнуляем
    var layers = {};

    // Оставляем только флаги и окончания рек
    // Оставляем только окончания рек
    if( tile[Tile.param.layers].river_end )
        layers.river_end = tile[Tile.param.layers].river_end;

    tile[Tile.param.layers] = layers;

    var climate = tile[Tile.param.climate];
    var dep = tile[Tile.param.dep];
    var wonder = Tile.getWonder(tile);;
    var town = tile[Tile.param.town];
    var rid = tile[Tile.param.rid];

    var road = utils.dec2bin(tile[Tile.param.road], true);

    var player = Tile.getPlayerId(tile);
    var townLevel = tile[Tile.param.townLevel];

    var dataClim = this.generateClimate(tile, layers);

    //климат - первичный (в т.ч. цикада)
    var clim = climate-1;

    if( clim != 0 )
        this.generateHM(tile, layers, clim, rid);
    
    var impList = MapImp.getAll();
    for (var imp in impList.getList()){
        imp = impList.getElem(imp);

        if( imp.getDisplay().onRiver )
            continue;
        
        var level = Tile.getTileImpLevel(tile, imp.getId()),
            accRel = this.calcTileRel(tile, function(tile){
                return tile ? (Tile.getPlayerId(tile) == wofh.account.id && tile[Tile.param.dep] == lib.map.nodeposit) : false;
            });
        
        this.generateImp(tile, layers, imp, level, climate, accRel, rid);
    }

    /*улучшение - водяное колесо*/
    if(Tile.getTileImpLevel(tile, 5)){
        var accRel = this.calcTileRel(tile, function(tile){
            return tile ? (Tile.getPlayerId(tile) == wofh.account.id && tile[Tile.param.town] != lib.town.notown) : false;
        });
        var bridgeData = this.calcWaterMill(tile);
        bridgeData.accRel = accRel;
        layers['imp'+5] = [bridgeData];
    }

    //города и месторождения
    if( town != lib.town.notown && climate != Tile.climateIds.water && dep == lib.map.nodeposit ){
        //город
        var relation = Account.calcRelation(Tile.getPlayerId(tile), Tile.getCountryId(tile));
        var townColor;

        if (relation == 0)
            townColor = relation;
        else if (relation > 2)
            townColor = relation - 2;
        else
            townColor = relation + 2;

        if( !layers.townres )
            layers.townres = [];

        townLevel = townLevel%100;
        
        this.generateTownres(tile, layers, townColor, townLevel, player, wonder);
        
        //Чудо Света
        if( !wonder.isEmpty() )
            layers.wonder = [{type: wonder.id, x: 1-wonder.isActive(), y: 0}];
    }
    else
        townLevel = -1;

    //мост
    if( Tile.getTileImpLevel(tile, 0) ){
        var accRel = this.calcTileRel(tile, function(tile){
            return tile ? (Tile.getPlayerId(tile) == wofh.account.id && tile[Tile.param.town] != lib.town.notown) : false;
        });
        var bridgeData = this.calcBridge(tile, 1);

        bridgeData.accRel = accRel;

        layers['imp'+0] = [bridgeData];
    }
    
    //стыкующиеся месторождения
    this.generateMatingDep(tile, layers);
    
    //месторождение
    if( dep != lib.map.nodeposit ){
        if( dep != Deposit.undefined ){
            if( !layers.townres )
                layers.townres = [];
            
            this.generateDep(tile, layers, dep, player);
        }
        else if( climate != Tile.climateIds.water ){
            if( !layers.townres ) 
                layers.townres = [];
            
            this.generateUndefDep(tile, layers, dep, climate, rid);
        }
    }
    else if( town != lib.town.notown && climate == Tile.climateIds.water )
        tile[Tile.param.dep] = Deposit.undefined;

    //случайные водные месторождения
    this.generateWaterDep(tile, layers, dep, climate, dataClim, rid);
    
    if( road ){
        layers.road = [];
        
        this.generateRoads(tile, layers, climate);
    }

    if( tile[Tile.param.flag] )
        layers.flag = [{type: tile[Tile.param.flag]}];

    var dataFog = this.generateFog(tile, layers, tile[Tile.param.fog]);
    
    if( tile[Tile.param.fog] ){
        // Заносим крайние тайлы карты в массивы для далнейшей обработки
        if( dataFog.fog.lu && !this.map.getTileByDir(tile[Tile.param.posTMT], 1) ){
            if( !this.mapTopEdgeTiles )
                this.mapTopEdgeTiles = [];

            this.mapTopEdgeTiles.push(tile);
        }

        if( dataFog.fog.rd && !this.map.getTileByDir(tile[Tile.param.posTMT], 5) ){
            if( !this.mapBottomEdgeTiles )
                this.mapBottomEdgeTiles = [];

            this.mapBottomEdgeTiles.push(tile);
        }
    }

    layers.grid = [{type: 'grd', x: 0, y: 0}];
};
    
    bckMap.prototype.generateClimate = function(tile, layers, tiles){
        var climRel = this.getClimRel(tile[Tile.param.clim_new], tile[Tile.param.climate]-1),
            clim = tile[Tile.param.climate]-1,//климат - первичный (в т.ч. цикада)
            rid = tile[Tile.param.rid];
            
        //проверка на глубоководье
        if( clim == Tile.climateIds.water-1 || climRel.norm[0] == 0 )//либо вода в тайле, либо в тайле сверху
            var dwAmbit = this.calcTileWaterAmbit(tile, {tiles:tiles, norm:climRel.norm});
        else
            var dwAmbit = 0;

        //климат - сглаживания, скругления
        var aliasingData = this.generateClimateAliasing(tile, layers, climRel, clim, dwAmbit, rid);

        if( this.allowTileBack() && layers.cr && (clim == Tile.climateIds.water-1 || (climRel.diag && aliasingData.s_type != 3) || (!climRel.diag && (aliasingData.sign == 'c' || aliasingData.sign == 'd'))) ){
            //выводим тайлы с подложкой только для тех случаев, когда нет скруглений
        }
        else
            layers.c = [{type: rid%this.imgSets.c, x: 0, y: this.getSpriteY(dwAmbit, clim)}];
        
        return {dwAmbit: dwAmbit};
    };
    
        bckMap.prototype.generateClimateAliasing = function(tile, layers, climRel, clim, dwAmbit, rid){
            var rand = tile[Tile.param.layers].river_end ? 0 : rid%this.imgSets.cr;

            if(!climRel.diag){
                climRel = climRel.norm;

                if(clim!=climRel[0] || clim!=climRel[1] || clim!=climRel[2]){
                    if(clim==0)
                        var sign = '0';
                    else if(climRel[1]==0)
                        var sign = 'd';
                    else if(climRel[2]==0)
                        var sign = 'c';
                    else
                        var sign = '1';

                    if(sign=='d')
                        layers.cr = [{type: sign + clim + rand + '_' + climRel[0], x: +climRel[2], y: 0}];
                    else if(sign=='c')
                        layers.cr = [{type: sign + (climRel[0]+1) + rand + '_' + (+climRel[1] - 1), x: clim-1, y: 0}];
                    else if(sign=='0')
                        layers.cr = [{type: sign + climRel[0] + rand + '_' + climRel[1], x: climRel[2], y: 0}];
                    else{
                        if(climRel[0] != 0) rand = 0; //для пересечений без климатов используем только один набор 

                        layers.cr = [{type: sign + climRel[0] + rand + '_' + (+climRel[1] - 1), x: climRel[2] - 1, y: 0}];
                    }
                }
            }
            else{
                var sprite = climRel.diag.type < 6 ? 'a' : 'b';

                if(sprite == 'b')
                    climRel.diag.type -= 6;

                if(clim == 0)
                    var s_type = 2;
                else if(climRel.diag.clim == 0)
                    var s_type = 1;
                else
                    var s_type = 3;

                if( s_type == 3 )
                    rand = 0;//для пересечений без климатов используем только один набор 

                layers.cr = [{type: sprite + s_type + rand + '_' +((s_type == 1? clim: climRel.diag.clim) - 1), x: climRel.diag.type, y: 0}];
            }

            if( dwAmbit && dwAmbit < 15 ){
                layers.cr = layers.cr||[];

                layers.cr.push({type: 'dw' + rid%this.imgSets.c_dw + '_' + (layers.cr.length ? 1 : 0), x: dwAmbit, y: 0});
            }
            
            return {
                sign: sign,
                s_type: s_type
            };
        };
        
        bckMap.prototype.allowTileBack = function(){
            return true;
        };
        
        bckMap.prototype.getSpriteY = function(dwAmbit, clim){
            return dwAmbit == 15 ? Tile.climateIds.deepwater - 1 : clim;
        };
        
    bckMap.prototype.generateHM = function(tile, layers, clim, rid){
        layers.hm = [];
        layers.pike = [];

        var heightMap = [], //карта высот
            hills = utils.dec2bin(tile[Tile.param.hill_new]);

        for (var i = 0; i < 4; ++i) {
            var hillStr = i==0? hills.slice(-(i+1) * 6): hills.slice(-(i+1) * 6, -i * 6);

            if(!hillStr.length)
                break;

            var hill = utils.bin2dec(hillStr);

            if(!hill)
                continue;

            if(hill % 2 == 0){
                hill /= 2;

                //карта высот
                this.calcHillMap(heightMap, hill);

                var picX = hill;
                var cut = utils.toInt(picX/this.spriteSizes.hm);
                picX -= this.spriteSizes.hm * cut;

                layers.hm.push({type: 'h'+i+cut+'_'+rid%this.imgSets.h, x: picX, y: 0});
            }
            else{
                hill = utils.toInt(hill/2);

                //карта высот

                this.calcHillMap(heightMap, hill, true);

                var picX = utils.toInt(hill/2);
                var cut = utils.toInt(picX/this.spriteSizes.hma);
                picX -= this.spriteSizes.hma * cut;

                layers.hm.push({type: 'ha'+i+cut+'_'+rid%this.imgSets.h, x: picX, y: (hill%2? 0: 1)});
            }
        }

        //горы
        hills = utils.dec2bin(tile[Tile.param.mount_new]);

        for (var i = 0; i < 4; ++i) { //разбиваем массив гор на климаты
            var hillStr = i==0? hills.slice(-(i+1) * 6): hills.slice(-(i+1) * 6, -i * 6);

            if(!hillStr.length)
                break;

            var hill = utils.bin2dec(hillStr);//собираем гору нужного климата

            //в каждой строке 6 бит, последний - используется или нет скругление
            //остальные 5 бит - индекс картинки

            if(!hill)
                continue;

            if(hill % 2 == 0){
                hill /= 2;

                if(hill == 15){
                    var layersItem = {type: 'mt'+clim, x: rid%this.imgSets.mt, y: 0};
                }else{
                    var picX = hill;
                    var cut = utils.toInt(picX/this.spriteSizes.hm);

                    picX -= this.spriteSizes.hm * cut;

                    var layersItem = {type: 'm'+i+cut+'_'+rid%this.imgSets.m, x: picX, y: 0};
                }

                if(hill%2==1){
                    layers.pike.push(layersItem);
                }else{
                    layers.hm.push(layersItem);
                }
            }else{
                hill = utils.toInt(hill/2);

                var picX = utils.toInt(hill/2);
                var cut = utils.toInt(picX/this.spriteSizes.hma);
                picX -= this.spriteSizes.hma * cut;

                var layersItem = {type: 'ma'+i+cut+'_'+rid%this.imgSets.m, x: picX, y: (hill%2? 0: 1)};

                var mount_center = this.diagRounds[utils.toInt(hill/2)].m_center;

                if(mount_center){
                    layers.pike.push(layersItem);
                }else{
                    layers.hm.push(layersItem);
                }
            }
        }

        tile[Tile.param.heightMap] = heightMap;
    };

    bckMap.prototype.generateImp = function(tile, layers, imp, level, climate, accRel, rid){
        if( imp.getDisplay().noRelatives ){
            var rel = level ? 15 : 0;
        }
        else{
            var rel = this.calcTileAmbit(tile, function(tile){
                var relLevel = Tile.getTileImpLevel(tile, imp.getId());

                if( !level && relLevel )
                    level = relLevel;

                return relLevel;
            });
        }

        //Отрисовываем части улучшений в тех местах, где их на самом деле нет.
        //Например, край улучшения построенного на снегах может оказаться на тайле с водой. В таком случае он будет покрашен под траву
        var impClimate = climate == Tile.climateIds.water? Tile.climateIds.grasslands: climate;

        if (rel==15) {
            var impType = rid%this.imgSets.imp;
            if(imp.getDisplay().useClimate){
                layers['imp'+imp.getId()] = [{type: 'env'+imp.getId()+'_'+utils.toInt(impType/this.spriteSizes.imp)+impClimate+(level||1), x: impType%this.spriteSizes.imp, y: 0, accRel: accRel, info: {mapimp: imp.getId()}}];	
            } 
            else {
                layers['imp'+imp.getId()] = [{type: 'env'+imp.getId()+'_'+utils.toInt(impType/this.spriteSizes.imp)+(level||1), x: impType%this.spriteSizes.imp, y: 0, accRel: accRel, info: {mapimp: imp.getId()}}];	
            }
        } else if(rel) {
            if(imp.getDisplay().useClimate){
                layers['imp'+imp.getId()] = [{type: 'env'+imp.getId()+'_r'+impClimate+(level||1), x: rel, y: 0, accRel: accRel, info: {mapimp: imp.getId()}}];
            } else {
                layers['imp'+imp.getId()] = [{type: 'env'+imp.getId()+'_r'+(level||1), x: rel, y: 0, accRel: accRel, info: {mapimp: imp.getId()}}];
            }
        }
    };

    bckMap.prototype.generateTownres = function(tile, layers, townColor, townLevel, player, wonder){
        townColor = player == 0 ? 5 : townColor;

        layers.townres.push({type: 'town_'+(townLevel+1)+'_'+townColor+'_'+(player != 0 && !wonder.isEmpty()? 1: 0), x: 0, y: 0});
    };

    bckMap.prototype.generateMatingDep = function(tile, layers){
        for(var res in Deposit.joined){
            var res = Deposit.joined[res];

            var relAll = this.calcTileAmbit(tile, function(tile){return tile? tile[Tile.param.dep]-1 == res: false;});
            var relUnused = this.calcTileAmbit(tile, function(tile){return tile? tile[Tile.param.dep]-1 == res && Tile.getPlayerId(tile) == 0 : false;});

            if (relAll) {
                if(!layers.resStack)
                    layers.resStack = [];

                layers.resStack.push({type: 'res_'+utils.twoDigits(res)+'a', x: relAll, y: 0, filterDep: 1+(relAll==relUnused?2:0), info: {deposit: res+1}});
            }
            
            if (relUnused && relAll != relUnused){
                layers.resStack.push({type: 'res_'+utils.twoDigits(res)+'a', x: relUnused, y: 0, filterDep: 2, info: {deposit: res+1}});
            }
        }
    };

    bckMap.prototype.generateDep = function(tile, layers, dep, player){
        //стыкующиеся месторождения
        if( utils.inArray(Deposit.joined, dep - 1) ){
            if( player )
                layers.townres.push({type: 'res_'+utils.twoDigits(dep-1)+'b', x: 0, y: 0, filterDep: 1, info: {deposit: dep}});
        }
        else //не стыкующиеся
            layers.townres.push({type: 'res_'+utils.twoDigits(dep-1), x: player ? 1 : 0, y: 0, info: {deposit: dep}});
    };

    bckMap.prototype.generateUndefDep = function(tile, layers, dep, climate, rid){
        layers.townres.push({type: 'res_u'+climate+(rid%this.imgSets.ures), x: 0, y: 0, info: {deposit: dep}});
    };

    bckMap.prototype.generateWaterDep = function(tile, layers, dep, climate, dataClim, rid){
        if( climate == Tile.climateIds.water && dep == lib.map.nodeposit && !tile[Tile.param.env] && dataClim.dwAmbit%2==0 && rid%3==0 ){
            var rid2 = rid/3;
            if (!layers.townres)
                layers.townres = [];
            
            var clim2 = this.calcUndfWaterResSecondaryClimate(tile);
            
            layers.townres.push({type: 'res_u'+Tile.climateIds.water+clim2+(rid2%this.imgSets.ures), x: 0, y: 0, info: {deposit: dep}});
        }
    };
    
    bckMap.prototype.generateRoads = function(tile, layers, climate){
        layers.pike_road = [];
        
        this.calcTileRoads(tile);

        if( Tile.hasMountainTunnel(tile) ){
            var tunnel_arches = this.calcTileTunnelArches(tile);

            if( tunnel_arches.length )
                layers.road_joints = tunnel_arches;
        }
    };
    
    bckMap.prototype.generateFog = function(tile, layers, fogRaw, noCalcClear){
        fogRaw = utils.dec2bin(fogRaw, true);

        var fogDirs = ['c','l','r','u','d','lu','ld','ru','rd'],
            fog = {};

        for(var i in fogDirs){
            fog[fogDirs[i]] = utils.toInt(fogRaw[i]);
        }
        
        this.generateThickFog(tile, layers, fog, noCalcClear);

        return {fog: fog};
    };
    
        bckMap.prototype.generateThickFog = function(tile, layers, fog, noCalcClear){
            var fo = -1;

            if(!fog.c) {
                fo = 12;
            }else if(!fog.l) {
                if(!fog.u || !fog.ru) fo = 4; 
                else if(!fog.d || !fog.rd) fo = 5; 
                else fo = 0;
            } else if(!fog.r) {
                if(!fog.u || !fog.lu) fo = 6; 
                else if(!fog.d || !fog.ld) fo = 7; 
                else fo = 1;
            } else if(!fog.u) {
                if(!fog.ld) fo = 4; 
                else if(!fog.rd) fo = 6; 
                else fo = 2;
            } else if(!fog.d) {
                if(!fog.lu) fo = 5; 
                else if(!fog.ru) fo = 7; 
                else fo = 3;
            } 
            else if(!fog.lu) fo = 8; 
            else if(!fog.ld) fo = 9; 
            else if(!fog.ru) fo = 10; 
            else if(!fog.rd) fo = 11;

            if(fo!=-1){
                var rand = tile[Tile.param.rid]%this.imgSets.fog;
                
                layers.fog = [{type: rand, x: fo, y: 0}];

                if( noCalcClear )
                    layers.fog[0].noCalcClear = noCalcClear;
            }
        };
        
// Вычисляем информацию о стыках с соседними тайлами для центрального тайла (позиция 5)
// tilesAmbit - окружение тайла в формате:
/*
         41   21
      44  	1	 22
         4     2
      7     5     3
         8     6
            9
*/
// Для расчета используется серверный алгоритм кодирования
bckMap.prototype.genClimateInfo = function(tilesAmbit){
    var MapPoint = function(tile){
        this.tile = tile;
    };

    MapPoint.prototype.getClimate = function(){
        return this.tile[Tile.param.climate];
    };
    MapPoint.prototype.getClimateInfo = function(){
        return this.tile[Tile.param.clim_new];
    };
    MapPoint.prototype.setClimateInfo = function(climateInfo){
        return this.tile[Tile.param.clim_new] = climateInfo;
    };

    var p = [];

    for(var tileIndex in tilesAmbit){
        p[tileIndex] = new MapPoint(tilesAmbit[tileIndex]);
    }

    var genFunc = function(func){
        func();
    };

    genFunc(function(){
        p[5].setClimateInfo(((p[1].getClimate() - 1) + 5 * (p[4].getClimate() - 1) + 25 * (p[2].getClimate() - 1)) << 1);
    });

    genFunc(function(){
        if( (p[5].getClimateInfo() & 1) == 1 ) return;

        if (p[6].getClimate() != p[8].getClimate()) return;
        if (p[6].getClimate() != p[9].getClimate()) return;
        if (p[6].getClimate() == p[5].getClimate()) return;
        if (p[5].getClimate() != p[4].getClimate()) return;
        if (p[5].getClimate() != p[2].getClimate()) return;
        if (p[5].getClimate() != p[1].getClimate()) return;
        if (p[7].getClimate() != p[5].getClimate() && p[7].getClimate() != p[6].getClimate()) return;
        if (p[3].getClimate() != p[5].getClimate() && p[3].getClimate() != p[6].getClimate()) return;

        var c = p[9].getClimate() - 1;
        p[5].setClimateInfo(1 + (0 << 1) + (c << 5));
    });

    genFunc(function(){
        if( (p[5].getClimateInfo() & 1) == 1 ) return;

        var a = 1 + (0 << 1) + ((p[5].getClimate() - 1) << 5);
        if (p[4].getClimateInfo() != a) return;

        if (p[2].getClimateInfo() == a) {
            p[5].setClimateInfo(1 + (5 << 1) + ((p[4].getClimate() - 1) << 5));
            return;
        }
        p[5].setClimateInfo(1 + ((p[2].getClimate() != p[5].getClimate() ? 1 : 2) << 1) + ((p[4].getClimate() - 1) << 5));
    });

    genFunc(function(){
        if( (p[5].getClimateInfo() & 1) == 1 ) return;

        var a = 1 + (0 << 1) + ((p[5].getClimate() - 1) << 5);
        if (p[2].getClimateInfo() != a) return;

        p[5].setClimateInfo(1 + ((p[4].getClimate() != p[5].getClimate() ? 3 : 4) << 1) + ((p[2].getClimate() - 1) << 5));
    });

    genFunc(function(){
        if( (p[5].getClimateInfo() & 1) == 1 ) return;

        if (p[2].getClimate() != p[3].getClimate()) return;
        if (p[2].getClimate() != p[6].getClimate()) return;
        if (p[22].getClimate() != p[2].getClimate()) return;
        if (p[21].getClimate() != p[2].getClimate() && p[21].getClimate() != p[5].getClimate()) return;
        if (p[5].getClimate() == p[2].getClimate()) return;
        if (p[4].getClimate() != p[5].getClimate()) return;
        if (p[1].getClimate() != p[5].getClimate()) return;

        p[5].setClimateInfo(1 + (13 << 1) + ((p[2].getClimate() - 1) << 5));
    });

    genFunc(function(){
        if( (p[5].getClimateInfo() & 1) == 1 ) return;

        if (p[4].getClimate() != p[8].getClimate()) return;
        if (p[4].getClimate() != p[7].getClimate()) return;
        if (p[4].getClimate() != p[44].getClimate()) return;
        if (p[4].getClimate() == p[5].getClimate()) return;
        if (p[2].getClimate() != p[5].getClimate()) return;
        if (p[1].getClimate() != p[5].getClimate()) return;

        p[5].setClimateInfo(1 + (10 << 1) + ((p[4].getClimate() - 1) << 5));
    });

    genFunc(function(){
        if( (p[5].getClimateInfo() & 1) == 1 ) return;

        if (p[2].getClimate() != p[3].getClimate()) return;
        if (p[2].getClimate() != p[6].getClimate()) return;
        if (p[2].getClimate() == p[5].getClimate()) return;
        if (p[4].getClimate() != p[5].getClimate()) return;
        if (p[1].getClimate() != p[5].getClimate() && p[1].getClimate() != p[2].getClimate()) return;

        p[5].setClimateInfo(1 + ((p[1].getClimate() == p[5].getClimate() ? 12 : 11) << 1) + ((p[2].getClimate() - 1) << 5));
    });

    genFunc(function(){
        if( (p[5].getClimateInfo() & 1) == 1 ) return;

        if (p[4].getClimate() != p[7].getClimate()) return;
        if (p[4].getClimate() != p[8].getClimate()) return;
        if (p[4].getClimate() == p[5].getClimate()) return;
        if (p[2].getClimate() != p[5].getClimate()) return;
        if (p[5].getClimate() != p[1].getClimate() && p[4].getClimate() != p[1].getClimate()) return;

        p[5].setClimateInfo(1 + ((p[1].getClimate() == p[5].getClimate() ? 9 : 8) << 1) + ((p[4].getClimate() - 1) << 5));
    });

    genFunc(function(){
        if( (p[5].getClimateInfo() & 1) == 1 ) return;

        if (p[1].getClimate() != p[2].getClimate()) return;
        if (p[1].getClimate() != p[5].getClimate()) return;
        if (p[4].getClimate() == p[5].getClimate()) return;
        if (p[4].getClimate() != p[44].getClimate()) return;
        if (p[41].getClimate() != p[5].getClimate() && p[41].getClimate() != p[4].getClimate()) return;

        p[5].setClimateInfo(1 + (6 << 1) + ((p[4].getClimate() - 1) << 5));
    });

    genFunc(function(){
        if( (p[5].getClimateInfo() & 1) == 1 ) return;

        if (p[2].getClimate() != p[22].getClimate()) return;
        if (p[2].getClimate() != p[21].getClimate() && p[5].getClimate() != p[21].getClimate()) return;
        if (p[1].getClimate() != p[5].getClimate()) return;
        if (p[1].getClimate() != p[4].getClimate()) return;
        if (p[2].getClimate() == p[5].getClimate()) return;

        p[5].setClimateInfo(1 + (7 << 1) + ((p[2].getClimate() - 1) << 5));
    });
};

bckMap.prototype.generateEdges = function(){
    var tilesAmbit = [],
        layers,
        climRel,
        fogRaw,
        fogLayer,
        getInitClimInfo = function(c1, c2, c4){
            return ((c1 - 1) + 5 * (c4 - 1) + 25 * (c2 - 1)) << 1;
        };

    // Вычисление информации о стыкх с соседями для тайлов выходящих за границы карты (верх и низ)
    // 1) Заполняем окружения тайла
    // 2) Расчитываем стыки с туманом
    // 3) Вычисляем информацию о стыках
    /* Формат окружения. Расчет ведётся для центрального тайла (позиция 5)
           21 22      
        41  1  2  3
        44  4  5  6
            7  8  9
    */
    /*
         41   21
      44  	1	 22
         4     2
      7     5     3
         8     6
            9
    */
    if( this.mapTopEdgeTiles ){
        for(var tile in this.mapTopEdgeTiles){
            tilesAmbit[9] = this.mapTopEdgeTiles[tile];
            tilesAmbit[8] = this.map.getTileByDir(tilesAmbit[9][Tile.param.posTMT], 0);
            tilesAmbit[6] = this.map.getTileByDir(tilesAmbit[9][Tile.param.posTMT], 2);

            if( !tilesAmbit[6] || !tilesAmbit[8] )
                continue;

            tilesAmbit[5] = [];

            tilesAmbit[5][Tile.param.posTMT] = {
                x: tilesAmbit[9][Tile.param.posTMT].x + Tile.dirsMap[1].x,
                y: tilesAmbit[9][Tile.param.posTMT].y + Tile.dirsMap[1].y
            };


            climRel = this.getClimRel(tilesAmbit[9][Tile.param.clim_new], tilesAmbit[9][Tile.param.climate]-1);

            tilesAmbit[5][Tile.param.climate] = climRel.norm[0]+1;
            tilesAmbit[5][Tile.param.layers] = {};
            tilesAmbit[5][Tile.param.rid] = tilesAmbit[9][Tile.param.rid];

            tilesAmbit[1] = [];
            tilesAmbit[1][Tile.param.climate] = tilesAmbit[5][Tile.param.climate];


            climRel = this.getClimRel(tilesAmbit[8][Tile.param.clim_new], tilesAmbit[8][Tile.param.climate]-1);

            tilesAmbit[4] = [];
            tilesAmbit[4][Tile.param.climate] = climRel.norm[0]+1;

            tilesAmbit[7] = [];
            tilesAmbit[7][Tile.param.climate] = climRel.norm[1]+1;


            climRel = this.getClimRel(tilesAmbit[6][Tile.param.clim_new], tilesAmbit[6][Tile.param.climate]-1);

            tilesAmbit[2] = [];
            tilesAmbit[2][Tile.param.climate] = climRel.norm[0]+1;

            tilesAmbit[3] = [];
            tilesAmbit[3][Tile.param.climate] = climRel.norm[2]+1;


            // Дальнее окружение (необходимо для корректного расчета стыков)
            tilesAmbit[11] = [];
            tilesAmbit[11][Tile.param.climate] = tilesAmbit[5][Tile.param.climate];

            tilesAmbit[41] = [];
            tilesAmbit[41][Tile.param.climate] = tilesAmbit[4][Tile.param.climate];

            tilesAmbit[44] = [];
            tilesAmbit[44][Tile.param.climate] = tilesAmbit[7][Tile.param.climate];

            tilesAmbit[21] = [];
            tilesAmbit[21][Tile.param.climate] = tilesAmbit[2][Tile.param.climate];

            tilesAmbit[22] = [];
            tilesAmbit[22][Tile.param.climate] = tilesAmbit[3][Tile.param.climate];

            // Дополнительно расчитываем информацию о стыках у верхних соседствующих тайлах (необходимо для корректного расчета стыков)
            tilesAmbit[1][Tile.param.clim_new] = getInitClimInfo(
                tilesAmbit[11][Tile.param.climate],
                tilesAmbit[21][Tile.param.climate],
                tilesAmbit[41][Tile.param.climate]
            );

            tilesAmbit[2][Tile.param.clim_new] = getInitClimInfo(
                tilesAmbit[21][Tile.param.climate], 
                tilesAmbit[22][Tile.param.climate], 
                tilesAmbit[1][Tile.param.climate]
            );

            tilesAmbit[4][Tile.param.clim_new] = getInitClimInfo(
                tilesAmbit[41][Tile.param.climate], 
                tilesAmbit[1][Tile.param.climate], 
                tilesAmbit[44][Tile.param.climate]
            );


            // Определяем мелководье
            if( tilesAmbit[5][Tile.param.climate] == Tile.climateIds.water ){
                if( 
                    tilesAmbit[9][Tile.param.climate] != Tile.climateIds.water || 
                    tilesAmbit[8][Tile.param.climate] != Tile.climateIds.water || 
                    tilesAmbit[6][Tile.param.climate] != Tile.climateIds.water ||
                    tilesAmbit[4][Tile.param.climate] != Tile.climateIds.water ||
                    tilesAmbit[2][Tile.param.climate] != Tile.climateIds.water
                )
                    tilesAmbit[5][Tile.param.low_water] = 1;
                else
                    tilesAmbit[5][Tile.param.low_water] = 0;

                if( 
                    tilesAmbit[4][Tile.param.climate] != Tile.climateIds.water || 
                    tilesAmbit[2][Tile.param.climate] != Tile.climateIds.water
                ){
                    tilesAmbit[1][Tile.param.low_water] = 1;
                }

                if( 
                    tilesAmbit[4][Tile.param.climate] == Tile.climateIds.water && 
                    (
                        tilesAmbit[7][Tile.param.climate] != Tile.climateIds.water ||
                        tilesAmbit[8][Tile.param.climate] != Tile.climateIds.water
                    )
                ){
                    tilesAmbit[4][Tile.param.low_water] = 1;
                }

                if( 
                    tilesAmbit[2][Tile.param.climate] == Tile.climateIds.water && 
                    (
                        tilesAmbit[3][Tile.param.climate] != Tile.climateIds.water ||
                        tilesAmbit[6][Tile.param.climate] != Tile.climateIds.water 
                    )
                ){
                    tilesAmbit[2][Tile.param.low_water] = 1;
                }
            }

            this.genClimateInfo(tilesAmbit);

            layers = {};

            // Учитываем стык с туманом
            fogRaw = 0,
            fogLayer = (tilesAmbit[8][Tile.param.layers].fog||[])[0];

            if( fogLayer ){
                if( fogLayer.x == 9 )
                    fogLayer.x = 0;

                fogRaw = 509;
            }

            fogLayer = (tilesAmbit[6][Tile.param.layers].fog||[])[0];

            if( fogLayer ){
                if( fogLayer.x == 10 )
                    fogLayer.x = 2;

                fogRaw = (fogRaw & 503)||503;
            }

            if( fogRaw )
                this.generateFog(tilesAmbit[5], layers, fogRaw, true);

            this.generateClimate(tilesAmbit[5], layers, [tilesAmbit[1], tilesAmbit[4], tilesAmbit[2]]);

            for(var layerName in layers){
                var layerArr = layers[layerName];

                for(var layer in layerArr){
                    layer = layerArr[layer];

                    layer.addHightMult = 0.5;
                    layer.addDisp = {x: 0, y: -utils.toInt(Tile.sizePxArr[0].y*0.5)};
                    layer.addSpriteDisp = [
                        {x: 0, y: utils.toInt(Tile.sizePxArr[0].y*0.5)},
                        {x: 0, y: utils.toInt(Tile.sizePxArr[1].y*0.5)}
                    ];

                    Tile.addLayer(tilesAmbit[9], layerName, layer);
                }
            }
        }

        delete this.mapTopEdgeTiles;
    }

    if( this.mapBottomEdgeTiles ){
        for(var tile in this.mapBottomEdgeTiles){
            tilesAmbit[1] = this.mapBottomEdgeTiles[tile];
            tilesAmbit[2] = this.map.getTileByDir(tilesAmbit[1][Tile.param.posTMT], 4);
            tilesAmbit[4] = this.map.getTileByDir(tilesAmbit[1][Tile.param.posTMT], 6);

            if( !tilesAmbit[2] || !tilesAmbit[4] )
                continue;

            tilesAmbit[21] = this.map.getTileByDir(tilesAmbit[2][Tile.param.posTMT], 1);
            tilesAmbit[22] = this.map.getTileByDir(tilesAmbit[2][Tile.param.posTMT], 2);

            if( !(tilesAmbit[21] && tilesAmbit[22]) ){
                climRel = this.getClimRel(tilesAmbit[2][Tile.param.clim_new], tilesAmbit[2][Tile.param.climate]-1);

                if( !tilesAmbit[21] ){
                    tilesAmbit[21] = [];

                    tilesAmbit[21][Tile.param.climate] = climRel.norm[0]+1;
                }

                if( !tilesAmbit[22] ){
                    tilesAmbit[22] = [];

                    tilesAmbit[22][Tile.param.climate] = climRel.norm[2]+1;
                }
            }

            tilesAmbit[41] = this.map.getTileByDir(tilesAmbit[4][Tile.param.posTMT], 1);
            tilesAmbit[44] = this.map.getTileByDir(tilesAmbit[4][Tile.param.posTMT], 0);

            if( !(tilesAmbit[41] && tilesAmbit[44]) ){
                climRel = this.getClimRel(tilesAmbit[4][Tile.param.clim_new], tilesAmbit[4][Tile.param.climate]-1);

                if( !tilesAmbit[41] ){
                    tilesAmbit[41] = [];

                    tilesAmbit[41][Tile.param.climate] = climRel.norm[0]+1;
                }

                if( !tilesAmbit[44] ){
                    tilesAmbit[44] = [];

                    tilesAmbit[44][Tile.param.climate] = climRel.norm[1]+1;
                }
            }

            if( !(tilesAmbit[21] && tilesAmbit[22] && tilesAmbit[41] && tilesAmbit[44]) )
                continue;

            tilesAmbit[5] = [];
            tilesAmbit[5][Tile.param.posTMT] = {
                x: tilesAmbit[1][Tile.param.posTMT].x + Tile.dirsMap[3].x,
                y: tilesAmbit[1][Tile.param.posTMT].y + Tile.dirsMap[3].y
            };
            tilesAmbit[5][Tile.param.climate] = tilesAmbit[1][Tile.param.climate];
            tilesAmbit[5][Tile.param.layers] = {};
            tilesAmbit[5][Tile.param.rid] = tilesAmbit[1][Tile.param.rid];

            tilesAmbit[3] = [];
            tilesAmbit[3][Tile.param.climate] = tilesAmbit[22][Tile.param.climate];

            tilesAmbit[6] = [];
            tilesAmbit[6][Tile.param.climate] = tilesAmbit[2][Tile.param.climate];

            tilesAmbit[7] = [];
            tilesAmbit[7][Tile.param.climate] = tilesAmbit[44][Tile.param.climate];

            tilesAmbit[8] = [];
            tilesAmbit[8][Tile.param.climate] = tilesAmbit[4][Tile.param.climate];

            tilesAmbit[9] = [];
            tilesAmbit[9][Tile.param.climate] = tilesAmbit[5][Tile.param.climate];

            // Учитываем мелководие
            if( 
                tilesAmbit[5][Tile.param.climate] == Tile.climateIds.water &&
                (
                    tilesAmbit[1][Tile.param.climate] != Tile.climateIds.water || 
                    tilesAmbit[2][Tile.param.climate] != Tile.climateIds.water || 
                    tilesAmbit[4][Tile.param.climate] != Tile.climateIds.water 
                )
            )
                tilesAmbit[5][Tile.param.low_water] = 1;
            else
                tilesAmbit[5][Tile.param.low_water] = 0;

            this.genClimateInfo(tilesAmbit);

            layers = {};

            this.generateClimate(tilesAmbit[5], layers, [tilesAmbit[1], tilesAmbit[4], tilesAmbit[2]]);

            // Учитываем стык с туманом
            fogRaw = 0,
            fogLayer = (tilesAmbit[4][Tile.param.layers].fog||[])[0];

            if( fogLayer ){
                if( fogLayer.x == 9 )
                    fogLayer.x = 3;

                fogRaw = 495;
            }

            fogLayer = (tilesAmbit[2][Tile.param.layers].fog||[])[0];

            if( fogLayer ){
                if( fogLayer.x == 10 )
                    fogLayer.x = 1;

                fogRaw = (fogRaw & 507)||507;
            }

            if( fogRaw )
                this.generateFog(tilesAmbit[5], layers, fogRaw, true);

            for(var layerName in layers){
                var layerArr = layers[layerName];

                for(var layer in layerArr){
                    layer = layerArr[layer];

                    layer.addHightMult = 0.5;
                    layer.addDisp = {x: 0, y: Tile.sizePxArr[0].y};

                    Tile.addLayer(tilesAmbit[1], layerName, layer);
                }
            }
        }

        delete this.mapBottomEdgeTiles;
    }
};



//вычисление вторичного климата для неизвестных водных месторождений


bckMap.prototype.calcUndfWaterResSecondaryClimate = function(tile){
    //вычисляется перебором соседних тайлов
    var climates = [];
    this.calcTileRel(tile, function(tile, dir){
        if(!tile) return;
        var climate = tile[Tile.param.climate];
        if (climate == Tile.climateIds.water) return;
        var mult = dir%2? 3: 1;//больший вес имеют тайлы связанные гранью
        climates[climate] = (climates[climate]||0) + mult;
    }, Tile.dirsMap);

    //считаем максимум
    var max = false;
    for (var i in climates){
        if(climates[i] == undefined) continue;
        if (max === false || climates[max] < climates[i]){
            max = i;
        }
    }

    return max||Tile.climateIds.grasslands;
}

bckMap.prototype.getTileCache = function(tile, param, dirs){
    var cache = tile[Tile.param.cache]||{};

    if( cache[param] == undefined ){
        if (param == 'accRel') {
            cache.accRel = this.calcTileRel(tile, function(tile){
                return tile ? (Tile.getPlayerId(tile) == wofh.account.id && tile[Tile.param.dep] == lib.map.nodeposit) : false;
            }, dirs||Tile.dirsMap9);		
        }
    }

    return cache[param];
};

bckMap.prototype.getClimRel = function(code, clim){
    if(code%2 == 0){
        code /= 2;
        var c1 = (code % 5);
        var c2 = utils.toInt(code % 25 / 5);
        var c3 = utils.toInt(code / 25);
        var i = (clim>0?1:0) + (c1>0?1:0) * 2 + (c2>0?1:0) * 4 + (c3>0?1:0) * 8;

        return {i: i, norm:[c1, c2, c3], code: code, clim: clim};
    } else{ 
        code = utils.toInt(code/2);

        var clim2 = utils.toInt(code / 16);//климат
        var type = code % 16;
        var i = type+16;

        code = this.diagRounds[type].norm;//форма скруглений

        var c0 = code % 2;//инверт
        var c1 = utils.toInt(code / 2) % 2;
        var c2 = utils.toInt(code / 4) % 2;
        var c3 = utils.toInt(code / 8);

        c1 = c0==c1 ? clim: clim2;
        c2 = c0==c2 ? clim: clim2;
        c3 = c0==c3 ? clim: clim2;

        return {i: i, norm:[c1, c2, c3], diag:{type: type, inv: c0==0, clim: clim2}};
    }
};

//карта высот - заполняет параметр heightMap
bckMap.prototype.calcHillMap = function(heightMap, hill, diag){
    if( diag ){
        var heights = this.diagRounds[utils.toInt(hill/2)].h_dirs;

        for(var i in heights){
            if( i==4 || i==8 ) continue;// у нас нет данных для нормальных скруглений по этим направлениям, поэтому всегда считаем, что там холмов нет
            if(heights[i] + hill%2 == 2 || heights[i] == 3){
                heightMap[i] = 1;
            }
        }
    }else{
        if(hill%2==1){
            heightMap[0] = 1;
            heightMap[5] = 1;
            heightMap[6] = 1;
            heightMap[7] = 1;
        }
        if((utils.toInt(hill/2))%2==1) heightMap[2] = 1;
        if((utils.toInt(hill/4))%2==1) heightMap[1] = 1;

        if(hill>7) heightMap[3] = 1;
    }
};

bckMap.prototype.getChunkForCoords = function(x, y){
    var posCMC = {};

    posCMC.x = Math.floor( x / Chunk.sizePx.x + y / Chunk.sizePx.y);
    posCMC.y = Math.floor(-x / Chunk.sizePx.x + y / Chunk.sizePx.y);

    return posCMC;
};

bckMap.prototype.getViewChunks = function(){
    var disp = {};
    disp.left = -this.posMWpx.x;
    disp.top = -this.posMWpx.y;
    disp.right = this.sizeVpx.x * this.map.zoom + disp.left;
    disp.bottom = this.sizeVpx.y * this.map.zoom + (2 * this.dispClimPx_y / this.map.zoom) + disp.top;

    var chunksTmp = [];

    chunksTmp.push(this.getChunkForCoords(disp.left, disp.top));
    chunksTmp.push(this.getChunkForCoords(disp.right, disp.top));
    chunksTmp.push(this.getChunkForCoords(disp.left, disp.bottom));
    chunksTmp.push(this.getChunkForCoords(disp.right, disp.bottom));

    var minX = 999, maxX = -999, minY = 999, maxY = -999;
    for(var i in chunksTmp){
        var chunk = chunksTmp[i];
        if(chunk.x < minX) minX = chunk.x;
        if(chunk.x > maxX) maxX = chunk.x;
        if(chunk.y < minY) minY = chunk.y;
        if(chunk.y > maxY) maxY = chunk.y;
    }

    //формируем список чанков
    var chunks = [];
    for(var y = minY; y <= maxY; y++){
        for(var x = minX; x <= maxX; x++){
            chunks.push({x: x, y: y});
        }
    }

    return chunks;
};

bckMap.prototype.updView = function(){
    this.updTileSelectAfterChunksLoaded = true;

    this.map.setUpd();

    this.showView();
};

bckMap.prototype.showView = function(forceUpdateLayers){
    if( !this.canShowView ) 
        return;

    if( !this.inWorker ){
        var chunksShow = this.getChunksNeedLoad();

        this.loadChunks(forceUpdateLayers);

        if( forceUpdateLayers || this.checkChunksShown(chunksShow).length ){
            this.chunksShown = chunksShow;

            this.calcImgLayers();
        }
    }

    this.requestRender();
};

bckMap.prototype.clearView = function(canvas){
    //чистка
    canvas.clearRect(0, 0, this.sizeVpx.x, this.sizeVpx.y);
};

bckMap.prototype.isTileVisible = function(drawBase){
    if( 
        drawBase.x < -Tile.sizePxArr[0].x ||
        drawBase.y < -Tile.sizePxArr[0].y * 1.5 ||
        drawBase.x > this.sizeVpx.x ||
        drawBase.y > this.sizeVpx.y
    ) 
        return false;

    return true;
};

bckMap.prototype.isTileHidden = function(drawBase){
    return	drawBase.x < -Tile.sizePxArr[0].x ||
            drawBase.y < -Tile.sizePxArr[0].y * 1.5 ||
            drawBase.x > this.sizeVpx.x ||
            drawBase.y > this.sizeVpx.y;
};

bckMap.prototype.getRes = function(layerName, resName, zoom){
    zoom = zoom === undefined ? this.getSetForLayerName(layerName) : zoom;

    return this.resLoaded[zoom][layerName][resName];
};

bckMap.prototype.setRes = function(zoom, layerName, resName, val){
    this.resLoaded[zoom][layerName][resName] = val;
};

bckMap.prototype.getOrLoadRes = function(layerName, resName, callback){
    var res = this.getRes(layerName, resName);

    if( !res ) 
        this.loadResource(layerName, resName, callback||this.globalLoadResourceCallback);

    return this.resIsLoaded(res) ? res: false;
};

bckMap.prototype.resIsLoaded = function(res){
    if( res === undefined )
        return false;

    if( res.length ){
        for(var i in res)
            if( typeof(res[i]) != 'object' ) 
                return false;
    }

    return typeof(res) == 'object';
};


bckMap.prototype.drawImage = function(canvas, img, p1, p2, p3, p4, p5, p6, p7, p8){
    canvas.drawImage(img, p1, p2, p3, p4, p5, p6, p7, p8);
};


bckMap.imgDisplay = {
    show: 0,
    hide: 1,
    shadow: 2,
};


//фильтруем картинки в процессе рисования
bckMap.prototype.filterImgAtDraw = function(resInfo, tileInfo, layerName){
    if( resInfo ){
        var filter = this.map.settings.p_filter2;

        if( resInfo.imgcls == 'road' ){
            if( utils.inMask(resInfo.roadType, filter[LS.mapFilter2.road]) )
                return bckMap.imgDisplay.hide;
        }
        else if( resInfo.imgcls == 'imp' ){
            if( utils.inMask(wMapFilter.filter.mapImp.show, filter[LS.mapFilter2.mapimp]) ) {
                //ближние МР оставляем
                if( !utils.inMask(wMapFilter.filter.mapImp.spec, filter[LS.mapFilter2.mapimp]) ){
                    if( !this.getTileCache(tileInfo.tile, 'accRel') )
                        return bckMap.imgDisplay.shadow;
                }
                else
                    return bckMap.imgDisplay.hide;
            }
            //улучшения-список
            if( filter[LS.mapFilter2.mapimpId] != -1 && tileInfo.info.mapimp != filter[LS.mapFilter2.mapimpId] )
                return bckMap.imgDisplay.hide;
        }
        else if( resInfo.imgcls == 'town' || layerName == 'flag' ){
            //города
            if( Tile.getPlayerId(tileInfo.tile) == Account.barbarian.id ){
                if( utils.inMask(wMapFilter.filter.town.barb, filter[LS.mapFilter2.town]) )
                    return bckMap.imgDisplay.hide;
            } 
            else{
                var relation = Account.calcRelation(Tile.getPlayerId(tileInfo.tile), Tile.getCountryId(tileInfo.tile));

                if( utils.inMask(relation, filter[LS.mapFilter2.town]) )
                    return bckMap.imgDisplay.hide;
            }

            //чудеса
            var wonder = Tile.getWonder(tileInfo.tile);

            if( !wonder.isEmpty() ){
                if( wonder.isActive() ){
                    if( utils.inMask(wMapFilter.filter.wonder.active, filter[LS.mapFilter2.wonder]) )
                        return bckMap.imgDisplay.hide;
                } 
                else{
                    if( utils.inMask(wMapFilter.filter.wonder.inactive, filter[LS.mapFilter2.wonder]) )
                        return bckMap.imgDisplay.hide;	
                }

                if (
                    utils.inMask(wMapFilter.filter.wonder.concurent, filter[LS.mapFilter2.wonder]) && 
                    tileInfo.tile[Tile.param.town] != wofh.town.id && 
                    wonder.id == wofh.town.slots.getWonder().id && 
                    Trade.calcDistance(tileInfo.posTMT, wofh.town.pos) < wonder.getWonderRadius()
                )
                    return bckMap.imgDisplay.hide;	
            }

            //чудеса-список
            var wonderId = filter[LS.mapFilter2.wonderId];

            switch( wonderId ){
                case -1:
                    break;
                case -2:
                    if (wonder.isEmpty()) 
                        return bckMap.imgDisplay.hide;
                    break;
                case -3: 
                    if( !wonder.isEmpty() )
                        return bckMap.imgDisplay.hide;
                    break;
                default: 
                    if( Tile.getWonder(tileInfo.tile).id != wonderId )
                        return bckMap.imgDisplay.hide;
            }
        }
        else if( resInfo.imgcls == 'res' ){
            if( utils.inMask(wMapFilter.filter.deposit.show, filter[LS.mapFilter2.deposit]) ){
                //доступные к колонизации
                if( !utils.inMask(wMapFilter.filter.deposit.spec, filter[LS.mapFilter2.deposit]) ){
                    var deposit = new Deposit(tileInfo.tile[Tile.param.dep], tileInfo.tile);

                    if( deposit.canColonize() )
                        return bckMap.imgDisplay.shadow;
                }
                else
                    return bckMap.imgDisplay.hide;
            }

            // id месторода или id группы к которой местород относится
            var depositOrGroupId = filter[LS.mapFilter2.depositId];

            if( depositOrGroupId != -1 ){
                if( Deposit.isGroupId(depositOrGroupId) ){
                    var deposit = new Deposit(tileInfo.info.deposit);

                    if( deposit.getGroupId() != depositOrGroupId )
                        return bckMap.imgDisplay.hide;
                }
                else if( tileInfo.info.deposit != depositOrGroupId )
                    return bckMap.imgDisplay.hide;
            }
        }
        else if( resInfo.imgcls == 'hill' ){
            if( utils.inMask(wMapFilter.filter.hill.show, filter[LS.mapFilter2.hill]) ){
                if( utils.inMask(wMapFilter.filter.hill.spec, filter[LS.mapFilter2.hill]) )
                    return bckMap.imgDisplay.hide;

                //ближние холмы оставляем
                if ( !this.getTileCache(tileInfo.tile, 'accRel') )
                    return bckMap.imgDisplay.shadow;
            }
        }
        else if( resInfo.imgcls == 'mount' ){
            if( utils.inMask(wMapFilter.filter.mount.show, filter[LS.mapFilter2.mount]) ) {
                if( utils.inMask(wMapFilter.filter.mount.spec, filter[LS.mapFilter2.mount]) )
                    return bckMap.imgDisplay.hide;

                //ближние горы оставляем
                if( !this.getTileCache(tileInfo.tile, 'accRel', Tile.dirsMap) )
                    return bckMap.imgDisplay.shadow;
            }
        }
    }

    return bckMap.imgDisplay.show;
};

//фильтрация картинок с дорогами
bckMap.prototype.filterRoadImgAtDraw = function(tileInfo, road, roadDir){
    var filter = this.map.settings.p_filter2;

    if( tileInfo.type != 0 && !utils.inMask(wMapFilter.filter.road.spec, filter[LS.mapFilter2.road]) ) {	
        var tile1 = tileInfo.tile;
        var tile2 = this.map.getTileByDir(tile1[Tile.param.posTMT], roadDir);

        if( !this.canBuildRoad(tile1, tile2, road.roadType+1) )
            return bckMap.imgDisplay.hide;
    }

    return bckMap.imgDisplay.show;
};

//можно ли улучшить дорогу
bckMap.prototype.canBuildRoad = function(tile1, tile2, roadType){
    if( !this.canBuildRoadInTile(tile1) && !this.canBuildRoadInTile(tile2) )
        return false;

    if( Tile.isNotResearchedRoad(roadType, Tile.isMountains(tile1) || Tile.isMountains(tile2)) )
        return false;

    return true;
};


//отрисовка дороги
bckMap.prototype.drawRoadTile = function(tileInfo, resInfo, drawBase, layerName){
    for(var road in tileInfo.roads){
        this.drawRoad(this.canvasW, layerName, tileInfo.roads[road], resInfo.roadType, tileInfo.step, drawBase);
    }
};

bckMap.prototype.canDrawRoadTile = function(tile){
    for(var road in tile.roads){
        road = tile.roads[road];

        var display = this.filterRoadImgAtDraw(tile, road, road.dir);

        if( display == bckMap.imgDisplay.hide ) return false;
    };

    return true;
};

bckMap.prototype.requestRender = function(){
    window.requestAnimFrame(this.render);

    //this.render();
};

bckMap.prototype.render = function(){
    if( !this.canRender() )
        return;
    
    if ( ls.getRoadsCache(true) )
        this.cleanRoadCacheQueue();
    
    this.renderLayers();
    
    if ( ls.getRoadsCache(true) )
        this.iterateRoadCacheQueue(0, 750);
    
    if( this.map.mapRoutes )
        this.drawRoute();
    
    this.drawDepLines(this.canvasW, true);
    
    this.drawHighCanvas();
};
    
    bckMap.prototype.canRender = function(){
        if( this.firstRender )
            return true;
        
        if( !this.layers || this.loadResCounter_calcImgLayers )
            return false;
        
        this.firstRender = true;
        
        if( !this.hasChunksLoad() )
            this.map.toggleLoadIndicator(false);
        
        return true;
    };
    
    bckMap.prototype.renderLayers = function(){
        this.posMWpx_draw = this.posMWpx;
        
        this.rSettings = {
            mapZoomRev: 1/this.map.zoom,
            drawZoomRev: 1/this.drawZoom,
            zoomFlagRev: 1/this.zoomFlag
        };
        this.rSettings.flagCanvasImgCoor = {
            x: this.flag.sizeDrawPx.x * this.rSettings.zoomFlagRev,
            y: this.flag.sizeDrawPx.y * this.rSettings.zoomFlagRev
        };
        this.rSettings.wideCanvasImgCoor = {
            x: this.tileWide.sizePx.x * this.rSettings.drawZoomRev,
            y: this.tileWide.sizePx.y * this.rSettings.drawZoomRev
        };
        this.rSettings.extraWideCanvasImgCoor = {
            x: this.tileExtraWide.sizePx.x * this.rSettings.drawZoomRev,
            y: this.tileExtraWide.sizePx.y * this.rSettings.drawZoomRev
        };
        this.rSettings.normCanvasImgCoor = {
            x: this.sizeTpx.x * this.rSettings.drawZoomRev,
            y: this.sizeTpx.y * this.rSettings.drawZoomRev
        };

        this.clearView(this.canvasW);
        this.canvasW.beginPath();

        this.clearView(this.canvasMountMask);
        this.canvasMountMask.beginPath();
        
        for(var layerName in this.layers){       
            if( this.cantRanderLayer(layerName) )
                continue;

            if( layerName == 'clear' )
                this.canvasW.globalCompositeOperation = 'destination-out';

            this.renderLayer(layerName, 0);

            if( this.allowSecondPassRender(layerName) )
                this.renderLayer(layerName, 1);
            
            if( layerName == 'clear' )
                this.canvasW.globalCompositeOperation = 'source-over';
        }

        this.canvasW.closePath();
        this.canvasMountMask.closePath();
    };
    
    bckMap.prototype.cantRanderLayer = function(layerName){
        return layerName == 'grid' && this.map.settings.p_iface[LS.mapIFace.grid] != 1;
    };
    
    bckMap.prototype.allowSecondPassRender = function(layerName){
        return layerName == 'road' || layerName == 'pike_road';
    };

    bckMap.prototype.renderLayer = function(layerName, pass){
        if( this.zoomPicLevel == 1 && (layerName == 'road' || layerName == 'pike_road') && !pass )
            return;
        
        var layer = this.layers[layerName],
            zoomPicLevel = this.getSetForLayerName(layerName),
            tRes = this.tRes[zoomPicLevel][layerName],
            resLoaded = this.resLoaded[zoomPicLevel][layerName],
            roadsCache = ls.getRoadsCache(true),
            imgRes;

        for(var i = 0; i < layer.length; ++i){
            var tile = layer[i];

            var resInfo = tRes[tile.type],
                alpha = tile.alpha !== undefined ? tile.alpha : 1,
                display = this.filterImgAtDraw(resInfo, tile, layerName);

            if( display == bckMap.imgDisplay.hide )
                continue;
            else if( display == bckMap.imgDisplay.shadow )
                alpha = 0.3;

            //var drawBase = this.calcDrawBase(tile.posTMpx);

            var drawBase = {
                x: (tile.posTMpx.x + this.posMWpx_draw.x) * this.rSettings.mapZoomRev,
                y: (tile.posTMpx.y + this.posMWpx_draw.y) * this.rSettings.mapZoomRev
            };

            // Не отображаем скрытые тайлы
            if( this.isTileHidden(drawBase) )
                continue;
            
            this.canvasW.globalAlpha = alpha;

            //чистка области
            if( layerName == 'clear' ){
                for(var set = 0; set < this.imgSets.cr; set++){
                    imgRes = this.resLoaded[zoomPicLevel]['c'][set];

                    if( this.resIsLoaded(imgRes) ){
                        this.drawImage(
                            this.canvasW,
                            imgRes,
                            0,
                            0,
                            this.sizeTpx.x,
                            this.sizeTpx.y,
                            drawBase.x,
                            drawBase.y,
                            this.rSettings.normCanvasImgCoor.x,
                            this.rSettings.normCanvasImgCoor.y);

                        break;
                    }
                }

                continue;
            }

            imgRes = resLoaded[tile.type];

            if( !this.resIsLoaded(imgRes) )
                continue;

            if( resInfo.type == 'road' ){
                if( roadsCache ){
                    if( !tile.cache )
                        tile.cache = {};

                    var roadImg = tile.cache[pass];

                    if( !roadImg && !this.map.isAnimated() )
                        this.addRoadToCacheQueueIterator(tile);
                    
                    if( debug.useMapRoadsCacheInWorker() ){
                        if( roadImg && !roadImg.complete && roadImg instanceof ImageBitmap )
                            roadImg.complete = true;
                    }
                    
                    if( roadImg && roadImg.complete ){
                        if( tile.roads.length ){
                            var roadImg2 = tile.cache[pass ? 0 : 1];

                            if( roadImg2 && roadImg2.complete )
                                tile.roads.length = 0;
                        }

                        this.drawImage(
                            this.canvasW,
                            roadImg,
                            0,
                            0,
                            this.canvasRoadTag.width,
                            this.canvasRoadTag.height,
                            drawBase.x - (this.canvasRoad.offset.x * this.rSettings.mapZoomRev),
                            drawBase.y - (this.canvasRoad.offset.y * this.rSettings.mapZoomRev),
                            this.canvasRoadTag.width * this.rSettings.mapZoomRev,
                            this.canvasRoadTag.height * this.rSettings.mapZoomRev);
                    }
                    else
                        this.renderRoadTile(tile, pass, resInfo, drawBase, layerName);
                }
                else
                    this.renderRoadTile(tile, pass, resInfo, drawBase, layerName);
            }
            else{
                if(layerName == 'flag'){
                    this.drawImage(
                        this.canvasW,
                        imgRes,
                        0,
                        0,
                        this.flag.sizePx.x,
                        this.flag.sizePx.y,
                        drawBase.x + this.flag.dispPx.x * this.rSettings.mapZoomRev,
                        drawBase.y + this.flag.dispPx.y * this.rSettings.mapZoomRev,
                        this.rSettings.flagCanvasImgCoor.x,
                        this.rSettings.flagCanvasImgCoor.y);
                }
                else if( resInfo.type == 'bridge' ){ //мост
                    this.drawBridge(this.canvasW, tile, drawBase, imgRes);
                }
                else if( resInfo.type == 'wide' ){ //широкие слои тайла
                    this.drawImage(
                            this.canvasW,
                            imgRes,
                            tile.x * this.tileWide.sizePx.x,
                            tile.y * this.tileWide.sizePx.y,
                            this.tileWide.sizePx.x,
                            this.tileWide.sizePx.y,
                            drawBase.x + ((resInfo.addDisp?resInfo.addDisp.x:0) + (tile.addDisp?tile.addDisp.x:0)) / this.map.zoom + this.tileWide.dispPx.x / this.drawZoom,
                            drawBase.y + ((resInfo.addDisp?resInfo.addDisp.y:0) + (tile.addDisp?tile.addDisp.y:0) - (resInfo.subtype=='upper'?this.dispClimPx_y:0)) / this.map.zoom + this.tileWide.dispPx.y / this.drawZoom,
                            this.rSettings.wideCanvasImgCoor.x,
                            this.rSettings.wideCanvasImgCoor.y);

                    if( resInfo.imgcls == 'mount' ){
                        // Отрисовывам горы на отдельном канвасе для маскирования тоннелей
                        this.drawImage(
                            this.canvasMountMask,
                            imgRes,
                            tile.x * this.tileWide.sizePx.x,
                            tile.y * this.tileWide.sizePx.y,
                            this.tileWide.sizePx.x,
                            this.tileWide.sizePx.y,
                            drawBase.x + ((resInfo.addDisp?resInfo.addDisp.x:0) + (tile.addDisp?tile.addDisp.x:0)) / this.map.zoom + this.tileWide.dispPx.x / this.drawZoom,
                            drawBase.y + ((resInfo.addDisp?resInfo.addDisp.y:0) + (tile.addDisp?tile.addDisp.y:0) - (resInfo.subtype=='upper'?this.dispClimPx_y:0)) / this.map.zoom + this.tileWide.dispPx.y / this.drawZoom,
                            this.rSettings.wideCanvasImgCoor.x,
                            this.rSettings.wideCanvasImgCoor.y);
                        }
                }
                else if( resInfo.type == 'extrawide' ){ //широкие слои тайла + бордюрка
    //					if( layerName == 'road' ){
    //						if( !this.canDrawRoadTile(tile) )
    //							continue;
    //					}

                    this.drawImage(
                        this.canvasW,
                        imgRes,
                        tile.x * this.tileExtraWide.sizePx.x,
                        tile.y * this.tileExtraWide.sizePx.y,
                        this.tileExtraWide.sizePx.x,
                        this.tileExtraWide.sizePx.y,
                        drawBase.x + (this.tileExtraWide.dispPx.x)/this.drawZoom-10/this.map.zoom,
                        drawBase.y + (this.tileExtraWide.dispPx.y)/this.drawZoom-10/this.map.zoom,
                        this.rSettings.extraWideCanvasImgCoor.x,
                        this.rSettings.extraWideCanvasImgCoor.y);
                }
                else{ //нормальные слои тайла
                    this.drawImage(
                        this.canvasW,
                        imgRes,
                        tile.x * this.sizeTpx.x,
                        tile.y * this.sizeTpx.y + (tile.addSpriteDisp?tile.addSpriteDisp[zoomPicLevel].y:0),
                        this.sizeTpx.x,
                        this.sizeTpx.y * (tile.addHightMult||1),
                        drawBase.x + ((tile.addDisp?tile.addDisp.x:0) + (resInfo.addDisp?resInfo.addDisp.x:0)) * this.rSettings.mapZoomRev,
                        drawBase.y + ((tile.addDisp?tile.addDisp.y:0) + (resInfo.addDisp?resInfo.addDisp.y:0)) * this.rSettings.mapZoomRev,
                        this.rSettings.normCanvasImgCoor.x,
                        this.rSettings.normCanvasImgCoor.y * (tile.addHightMult||1));
                }
            }

            this.canvasW.globalAlpha = 1;
        }
    };
        
        bckMap.prototype.addRoadToCacheQueueIterator = function(roadInfo){
            this.data.roadsCacheQueue.push(roadInfo);
        };
        
        bckMap.prototype.cleanRoadCacheQueue = function(){
            this.data.roadsCacheQueue = [];
        };
        
        bckMap.prototype.iterateRoadCacheQueue = function(pack, delay){
            this.clearTimeout(this.iterateRoadCacheQueueTO);
            
            var roadsCacheQueue = this.data.roadsCacheQueue||[];
            
            if( !roadsCacheQueue.length )
                return;
            
            pack = pack === undefined ? this.getRoadCacheQueuePack() : pack;
            
            this.drawRoadCache = true;
            
//            if( pack && roadsCacheQueue.length ){
//                var timeStart = timeMgr.getNowLocMS();
//            }
            
            for(var i = 0; i < pack; i++){
                this.preCacheRoadSync(roadsCacheQueue.pop());
                
                if( !roadsCacheQueue.length ){
                    this.drawRoadCache = false;
                    
                    this.requestRender();
                    
                    return;
                }
            }
            
            this.drawRoadCache = false;
            
            this.iterateRoadCacheQueueTO = this.setTimeout(this.iterateRoadCacheQueue, delay||100);
        };
        
            bckMap.prototype.getRoadCacheQueuePack = function(){
                return 4;
            };


bckMap.prototype.tryRender = function(delay){
    this.clearTimeout(this.renderTO);

    this.renderTO = this.setTimeout(this.requestRender, delay||16);
};

bckMap.prototype.renderRoadTile = function(tileInfo, pass, resInfo, drawBase, layerName){
    var rendered;
    
    if( pass ){
        tileInfo.step = 0; // Основное изображение

        if( this.drawRoadCache )
            this.canvasRoad.clearRect(0, 0, this.canvasRoadTag.width, this.canvasRoadTag.height);

        this.drawRoadTile(tileInfo, resInfo, drawBase, layerName);

        rendered = true;
    }
    else if( !this.map.isAnimated() ){
        if( this.drawRoadCache )
            this.canvasRoad.clearRect(0, 0, this.canvasRoadTag.width, this.canvasRoadTag.height);

        for(var step in this.roadAreaSteps[tileInfo.type]){
            tileInfo.step = this.roadAreaSteps[tileInfo.type][step];

            this.drawRoadTile(tileInfo, resInfo, drawBase, layerName);
        }

        rendered = true;
    }

    delete tileInfo.step;
    
    return rendered;
};

//добавить связь месторода и города. Передаём тайл с местородом
bckMap.prototype.addDepLine = function(tile){
    var town = tile[Tile.param.town];

    if( town != lib.town.notown ){//нужны тойло тайлы с указанными городами
        if( !this.depLinks[town] )
            this.depLinks[town] = {}; // создаем запись

        if( tile[Tile.param.dep] != lib.map.nodeposit )
            this.depLinks[town].dep = tile;//записываем тайл либо как местород
        else
            this.depLinks[town].town = tile;//либо как город
    }
};

bckMap.prototype.removeDepLine = function(town){
    delete this.depLinks[town];
};

bckMap.prototype.drawDepLines = function(canvas, showAllLinks){
    var link;

    if( showAllLinks ){
        if( !+this.map.settings.p_iface[LS.mapIFace.depLinks] )
            return;

        canvas.save();

        for (var town in this.depLinks){
            link = this.depLinks[town];

            if( !link.town || !link.dep ){
                delete this.depLinks[town];

                continue;
            }

            this.drawDepLine(canvas, link.town, link.dep, 'black');
        }

        canvas.restore();
    }
    else if( this.map.tileSelect && this.map.tileSelect.town ){
        link = this.depLinks[this.map.tileSelect.town.id];

        if( !link )
            return;

        canvas.save();

        this.drawDepLine(canvas, link.town, link.dep, 'yellow');

        canvas.restore();
    }
};

bckMap.prototype.drawDepLine = function(canvas, tile1, tile2, color){
    if (!tile1 || !tile2) return;

    var A = this.calcDrawBase(tile1[Tile.param.posTMpx]);
    var B = this.calcDrawBase(tile2[Tile.param.posTMpx]);

    if( this.isTileHidden(A) && this.isTileHidden(B) )
        return;

    this.centerDrawBase(A);
    this.centerDrawBase(B);

    var height = 100/this.map.zoom;

    A.x += 5/this.map.zoom;
    B.x -= 5/this.map.zoom;

    var AH = {x: A.x, y: A.y - height};
    var BH = {x: B.x, y: B.y - height};

    canvas.beginPath();

    canvas.lineWidth = 1;
    canvas.strokeStyle = color;
    canvas.moveTo(A.x, A.y);
    canvas.bezierCurveTo(AH.x, AH.y, BH.x, BH.y, B.x, B.y);
    canvas.stroke();

    canvas.closePath();
};


//могут ли улучшения тайла использоваться городом
bckMap.prototype.isTileImpCanBeUsed = function(tile){
    if (!tile) return false;
    for (var imp in tile[Tile.param.env]){
        imp = new MapImp(tile[Tile.param.env][imp]);
        if (imp.townCanUse()) return true;
    }
    return false;
};

bckMap.prototype.getImpLinkImgDisp = function(dir){
    if (dir == 1 || dir == 5) return 0;
    if (dir == 0 || dir == 4) return 1;
    if (dir == 3 || dir == 7) return 2;
    if (dir == 2 || dir == 6) return 3;
};

bckMap.prototype.calcImpLinks = function(){
    if (this.map.tileSelect){
        this.impLinks = [];

        //if ((this.map.tileSelect.town && !this.map.tileSelect.deposit) || ) {
        if (this.map.tileSelect.town && !this.map.tileSelect.deposit && this.map.tileSelect.town.id == wofh.town.id) { // текущий город
            this.impLinksType = 'town';
            for (var dir in Tile.dirsScr) {
                var nextTile = this.map.getTileByDir(this.map.tileSelect.posTMT, dir);

                if (this.isTileImpCanBeUsed(nextTile)){
                    var link = {};

                    link.tile = nextTile;
                    link.dir = dir;

                    link.imgX = this.getImpLinkImgDisp(link.dir);

                    link.id = this.dirsImpLink[dir];
                    link.isActive = wofh.town.usesmap/*this.map.tileSelect.tile[Tile.param.impMap]*/ & Math.pow(2, link.id);

                    this.impLinks.push(link);
                }
            }            

        } else if (this.isTileImpCanBeUsed(this.map.tileSelect.tile)) {// любое улучшение
            this.impLinksType = 'imp';
            var usesmap = this.map.tileSelect.tile[Tile.param.impMap];
            for (var dir in Tile.dirsScr) {
                var nextTile = this.map.getTileByDir(this.map.tileSelect.posTMT, dir);

                if (nextTile) {
                    /*var linkEnabled = false;
                    var linkDisabled = false;*/

                    if (usesmap & Math.pow(2, 8-this.dirsImpLink[dir])) {
                        /*linkEnabled = true;
                    }


                    if (!linkEnabled && nextTile[Tile.param.town] != lib.town.notown && nextTile[Tile.param.dep] == lib.map.nodeposit) {
                        linkDisabled = true;
                    }

                    if (linkEnabled || linkDisabled) {*/

                        var link = {};

                        link.tile = nextTile;
                        link.dir = dir;

                        link.imgX = this.getImpLinkImgDisp(link.dir);

                        link.id = this.dirsImpLink[8-dir];
                        link.isActive = true;//linkEnabled;

                        this.impLinks.push(link);
                    }
                }
            }
        }
    }
};

bckMap.prototype.showImpLinks = function(){
    if( this.map.isAnimated() )
        return;

    this.calcImpLinks();

    if (!this.impLinks || !this.impLinks.length) return;

    if (!this.map.tileSelect) return;

    var drawBase = this.calcDrawBase(this.map.tileSelect.tile[Tile.param.posTMpx]);

    var img = this.getOrLoadRes('env_links', 'link');

    if (!img) return;

    for (var i in this.impLinks) {
        var link = this.impLinks[i];

        var dispMap = Tile.dirsScr[link.dir];

        var imgY = 0;
        if (!link.isActive) imgY = 1;
        if (this.impLinksType == 'imp') imgY = 2;

        this.drawImage(
            this.canvas,
            img,
            link.imgX * this.sizeTpx.x,
            imgY * this.sizeTpx.y,
            this.sizeTpx.x,
            this.sizeTpx.y,
            drawBase.x + (dispMap.x * this.sizeTpx.x / 2) / this.map.zoom,
            drawBase.y + (dispMap.y * this.sizeTpx.y / 2) + this.getDrawBaseDispClimPx_y()/this.map.zoom,
            this.sizeTpx.x / this.drawZoom,
            this.sizeTpx.y / this.drawZoom);

    }
};

bckMap.prototype.drawGrid = function(){
    if(this.chunksShown.length==0)return;
    var min = this.chunksShown[0];
    var max = this.chunksShown[this.chunksShown.length-1];

    this.canvasW.beginPath();
    this.canvasW.lineWidth = 0.1/this.map.zoom;
    //this.canvas.strokeStyle = '#ccc';
    this.canvasW.globalAlpha = 0.3;
//	this.canvas.strokeStyle = '#000';
    //this.canvas.globalCompositeOperation = 'darken';
    //ось X
    for(var x=min.x*Chunk.sizeT.x; x<=(max.x+1)*Chunk.sizeT.x; x++){
        var posTMT = {x: x, y: min.y*Chunk.sizeT.y};
        var posTMpx = this.getPosTMpxByPosTMT(posTMT);
        var posTWpx = {
            x: (posTMpx.x + this.posMWpx.x-8)/this.map.zoom,
            y: (posTMpx.y + this.posMWpx.y - this.dispClimPx_y)/this.map.zoom
        };
        this.canvasW.moveTo(posTWpx.x,posTWpx.y);

        posTWpx.x -= 4000;
        posTWpx.y += 2000;
        this.canvasW.lineTo(posTWpx.x,posTWpx.y);
        this.canvasW.stroke();
    }

    //ось Y
    for(var y=min.y*Chunk.sizeT.y; y<=(max.y+1)*Chunk.sizeT.y; y++){
        var posTMT = {x: min.x*Chunk.sizeT.x, y: y};
        var posTMpx = this.getPosTMpxByPosTMT(posTMT);
        var posTWpx = {
            x: (posTMpx.x + this.posMWpx.x + 4)/this.map.zoom,
            y: (posTMpx.y + this.posMWpx.y - this.dispClimPx_y)/this.map.zoom
        };
        this.canvasW.moveTo(posTWpx.x,posTWpx.y);

        /*var posTMT = {x: (max.x+1)*Chunk.sizeT.x, y: y};
        var posTMpx = this.getPosTMpxByPosTMT(posTMT);
        var posTWpx = {
            x: Math.round((posTMpx.x + this.posMWpx.x)/this.map.zoom)+0.5,
            y: Math.round((posTMpx.y + this.posMWpx.y - this.dispClimPx_y)/this.map.zoom)+0.5
        }*/

        posTWpx.x += 4000;
        posTWpx.y += 2000;
        this.canvasW.lineTo(posTWpx.x,posTWpx.y);
        this.canvasW.stroke();
    }
    this.canvasW.globalAlpha = 1;
    //this.canvas.globalCompositeOperation = 'source-over';
};

/*
bckMap.prototype.calcCicadeDispT = function(posTMT){
    var dispsT = [];

    for(var i in this.cicadeSizes){
        var size = this.cicadeSizes[i];
        dispsT.push({
            x: Math.abs(posTMT.x%size), 
            y: Math.abs(posTMT.y%size)});
    }

    return dispsT;
}*/

bckMap.prototype.filterLayers = function(filter, set, noupd){
    if(typeof(filter)=='object'){
        for(var i in filter){
            this.filterLayers(filter[i], set, true);
        }
        this.requestRender(); // 'filterLayers'
        return;
    }

    var index = this.activeFilters.list.indexOf(filter);
    if(typeof(set) == 'undefined'){
        set = index == -1;
    }
    if(set){
        if(index == -1)
            this.activeFilters.list.push(filter);
    }else{
        if(index != -1)
            this.activeFilters.list.splice(index,1);
    }

    this.activeFilters.layers = [];
    for(filter in this.activeFilters.list){
        var filter = this.activeFilters.list[filter];
        var filterLayers = filterLayersData[filter];
        for(var layer in filterLayers){
            this.activeFilters.layers.push(filterLayers[layer]);
        }
    }

    if(!noupd){
        this.requestRender(); // 'filterLayers2'
    }
};

bckMap.prototype.iterateShownTiles = function(func){
    for(var chunk in this.chunksShown){
        chunk = this.map.getChunk(this.chunksShown[chunk]);

        if( !chunk )
            continue;

        var tile;

        for(var i = 0; i < chunk.tiles.length; i++){
            tile = chunk.tiles[i];
            
            if( !tile )
                continue;
            
            func(tile);
        }
    }
};


// Расчет слоев графики, загрузка ресурсов для отображения
bckMap.prototype.calcImgLayers = function(){
    var self = this,
        now = timeMgr.getNow(),
        resLoadedLayers = {},
        tResFlag = self.tRes[0].flag,
        loadResOpt = {mark: 'calcImgLayers'};

    this.layers = utils.clone(this.layersBlank_tile);

    this.depLinks = {};

    //собираем массив слоёв
    this.iterateShownTiles(function(tile){
//        if( Tile.isDebug(tile) === false )
//            return;
        
        self.addDepLine(tile);

        var layers = tile[Tile.param.layers];

        for(var layerName in layers){
            var layer = layers[layerName];

            if( tile[Tile.param.layersUpd] > self.createResTime ){
                var skip = true;

                for(var i = 0; i < layer.length; i++){
                    if( layer[i].tile )
                        self.layers[layerName].push(layer[i]);
                    else{
                        skip = false;
                        
                        break;
                    }
                }

                if( skip )
                    continue;
            }

            var resLoaded = resLoadedLayers[layerName];

            if( !resLoaded ){
                resLoaded = self.resLoaded[self.getSetForLayerName(layerName)][layerName];

                resLoadedLayers[layerName] = resLoaded;
            }

            if( layerName == 'flag' && !tResFlag[layer[0].type] )
                tResFlag[layer[0].type] = {url: reqMgr.prepareRequestUrl('/gen/flag/-'+layer[0].type+'.gif')};
            else if( layerName == 'hm' && !tile[Tile.param.layersUpd] && layer.length > 1 ){
                // Сортируем горы и холмы в зависимости от глубины
                if( self.calcBackgroundness(layer[0].x) < self.calcBackgroundness(layer[1].x) ){
                    var tmpElem = layer[0];
                    layer[0] = layer[1];
                    layer[1] = tmpElem;
                }
            }

            for(var i = 0; i < layer.length; i++){
                var res = layer[i];

                res.posTMT = tile[Tile.param.posTMT];
                res.posTMpx = tile[Tile.param.posTMpx];
                res.tile = tile;

                self.layers[layerName].push(res);

                if( !resLoaded[res.type] ){
                    self.loadResource(layerName, res.type, false, loadResOpt);
                }
            }
        }

        tile[Tile.param.layersUpd] = now;
    });

    //вычисляем слой, для скрытия обрезков
    this.calcClearLayer();
};


bckMap.prototype.runShow = function(){
    this.preparedResCount = 1;

    this.prepareRes();

    this.startShow();
};

bckMap.prototype.prepareRes = function(){
    if( ls.getRoadsCache(true) )
        this.prepareRoadsRes();
};

bckMap.prototype.prepareRoadsRes = function(){
    var self = this,
        loadResourceOpt = {callbackOnError: true},
        zoomPicLevelWas = this.zoomPicLevel;
    
    
    for(var zoomPicLevel in this.zoomPicLevels){
        this.zoomPicLevel = this.zoomPicLevels[zoomPicLevel];
        
        var roads = this.tRes[this.zoomPicLevel].road;
        
        for(var road in roads){
            road = roads[road];
            
            if( !this.getRes('road', road.roadType) ){
                this.preparedResCount += road.url.length;

                this.loadResource('road', road.roadType, function(){
                    self.startShow();
                }, loadResourceOpt);
            }
        }
    }
    
    this.zoomPicLevel = zoomPicLevelWas;
};

bckMap.prototype.startShow = function(){
    if( --this.preparedResCount )
        return;

    this.loadResourcesForView();

    this.canShowView = true; 

    this.showView();
};

bckMap.prototype.loadResourcesForView = function(){
    var self = this;

    for(var layerName in this.layers){
        if(layerName == 'clear' || layerName == 'flag') continue;

        var layer = this.layers[layerName];

        for(var tile in layer){
            var resType = layer[tile].type;

            if( !this.getRes(layerName, resType) )
                this.loadResource(layerName, resType, function(){
                    self.drawLoadResource();
                });
        }
    }

    this.loadInterfaceRes();
};

bckMap.prototype.calcClearLayer = function(){
    for(var tile in this.layers.fog){
        tile = this.layers.fog[tile];

        if( tile.noCalcClear )
            continue;

        var posTMT = tile.posTMT;

        for(var i in this.fogCheckArr[tile.x]){
            var dispTT = Tile.dirsMap[this.fogCheckArr[tile.x][i]],
                posTMT_Check = {x: posTMT.x + dispTT.x,	y: posTMT.y + dispTT.y},
                tile_Check = this.map.getTile(posTMT_Check);

            if( !tile_Check || tile_Check.length == 0 ){
                var posTMpx = {
                    x: tile.posTMpx.x + (dispTT.x - dispTT.y) * Tile.dispPxArr[0].x,
                    y: tile.posTMpx.y + (dispTT.x + dispTT.y) * Tile.dispPxArr[0].y
                };

                this.layers.clear.push({posTMT: posTMT_Check, posTMpx: posTMpx});
            }
        }
    }
};

bckMap.prototype.calcBackgroundness = function(x4){
    return (x4>>1) + 8*(x4%2);
};

bckMap.prototype.getSetForLayerName = function(layerName){
    if( layerName == 'flag' )  
        return 0;

    return this.zoomPicLevel;
};

//проверяем загрузку слоя (все его ресурсы должны быть загружены)
bckMap.prototype.isLayerLoaded = function(layerName){
    var zoom = this.getSetForLayerName(layerName);

    var layerLoaded = this.resLoaded[zoom][layerName];
    for(var resName in layerLoaded){
        if(layerLoaded[resName].length>1){
            for(var i in layerLoaded[resName]){
                if(layerLoaded[resName][i] === true) return false;
            }
        }else{
            if(layerLoaded[resName] === true) return false;
        }
    }
    return true;
};

bckMap.prototype.genSprites = function(zoom){
    if(typeof(this.resLoaded[zoom].c[0]) != 'object') return;

    if(typeof(this.resLoaded[zoom].c.mask) == 'object' && !this.tRes[zoom].c.mask.used){
        this.genSpriteNorm(zoom);
        this.resLoaded[zoom].c.mask = false;
    }
    if(typeof(this.resLoaded[zoom].c.mask_a) == 'object' && !this.tRes[zoom].c.mask_a.used){
        this.genSpriteDiag(zoom, 'a');
        this.resLoaded[zoom].c.mask_a = false;
    }
    if(typeof(this.resLoaded[zoom].c.mask_b) == 'object' && !this.tRes[zoom].c.mask_b.used){
        this.genSpriteDiag(zoom, 'b');
        this.resLoaded[zoom].c.mask_b = false;
    }
};

bckMap.prototype.genSpriteNorm = function(zoom){
    var set = 0;

    var canvas1Tag = this.createTempCanvas(zoom, 1, 1);
    var canvas1 = canvas1Tag.getContext('2d');

    var canvas2Tag = this.createTempCanvas(zoom, 1, 1);
    var canvas2 = canvas2Tag.getContext('2d');

    var canvas3Tag = this.createTempCanvas(zoom, 1, 1);
    var canvas3 = canvas3Tag.getContext('2d');


    for(var clim1 = 1; clim1<=4; clim1++){
        this.genSpriteCorner(canvas1, zoom, clim1, true, true);

        for(var clim2 = 1; clim2<=5; clim2++){
            this.genSpriteCorner(canvas2, zoom, clim2, false, true);

            var canvasSTag = this.createTempCanvas(zoom, 4, 1);
            var canvasS = canvasSTag.getContext('2d');

            for(var clim3 = 1; clim3<=4; clim3++){
                this.genSpriteCorner(canvas3, zoom, clim3, true, false);
                if(clim1==clim3){
                    canvasS.drawImage(canvas2Tag, 0, 0, Tile.sizePxArr[zoom].x, Tile.sizePxArr[zoom].y, Tile.sizePxArr[zoom].x * (clim3-1), 0, Tile.sizePxArr[zoom].x, Tile.sizePxArr[zoom].y);
                    canvasS.drawImage(canvas3Tag, 0, 0, Tile.sizePxArr[zoom].x, Tile.sizePxArr[zoom].y, Tile.sizePxArr[zoom].x * (clim3-1), 0, Tile.sizePxArr[zoom].x, Tile.sizePxArr[zoom].y);
                }else{
                    canvasS.drawImage(canvas3Tag, 0, 0, Tile.sizePxArr[zoom].x, Tile.sizePxArr[zoom].y, Tile.sizePxArr[zoom].x * (clim3-1), 0, Tile.sizePxArr[zoom].x, Tile.sizePxArr[zoom].y);
                    canvasS.drawImage(canvas2Tag, 0, 0, Tile.sizePxArr[zoom].x, Tile.sizePxArr[zoom].y, Tile.sizePxArr[zoom].x * (clim3-1), 0, Tile.sizePxArr[zoom].x, Tile.sizePxArr[zoom].y);
                    if(clim1!=clim2){
                        canvasS.drawImage(canvas1Tag, 0, 0, Tile.sizePxArr[zoom].x, Tile.sizePxArr[zoom].y, Tile.sizePxArr[zoom].x * (clim3-1), 0, Tile.sizePxArr[zoom].x, Tile.sizePxArr[zoom].y);
                    }
                }
            }
            this.setRes(zoom, 'cr', '1' + clim1 + set + '_' + (clim2-1), canvasSTag);
        }
    }

    this.tRes[zoom].c.mask.used = true;
};

bckMap.prototype.genSpriteDiag = function(zoom, sign){

    var set = 0;

    var spriteSize = sign=='a'? 6: 8;

    var canvasITag = this.createTempCanvas(zoom, 1, 1);
    var canvasI = canvasITag.getContext('2d');

    for(var clim = 1; clim<=4; clim++){

        var canvasSTag = this.createTempCanvas(zoom, spriteSize, 1);
        var canvasS = canvasSTag.getContext('2d');

        for(var i = 0; i<spriteSize; i++){
            canvasI.drawImage(this.resLoaded[zoom].c[set], 0, clim * Tile.sizePxArr[zoom].y, Tile.sizePxArr[zoom].x, Tile.sizePxArr[zoom].y, 0, 0, Tile.sizePxArr[zoom].x, Tile.sizePxArr[zoom].y);
            canvasI.globalCompositeOperation = 'destination-in';
            canvasI.drawImage(this.resLoaded[zoom].c['mask_'+sign], i * Tile.sizePxArr[zoom].x, 0, Tile.sizePxArr[zoom].x, Tile.sizePxArr[zoom].y, 0, 0, Tile.sizePxArr[zoom].x, Tile.sizePxArr[zoom].y);
            canvasI.globalCompositeOperation = 'source-over';

            canvasS.drawImage(canvasITag, 0, 0, Tile.sizePxArr[zoom].x, Tile.sizePxArr[zoom].y, i * Tile.sizePxArr[zoom].x, 0, Tile.sizePxArr[zoom].x, Tile.sizePxArr[zoom].y);
        }

        this.setRes(zoom, 'cr', sign + '3' + set + '_' + (clim-1), canvasSTag);
    }

    this.tRes[zoom].c['mask_'+sign].used = true;
};

bckMap.prototype.createTempCanvas = function(zoom, x, y){
    var canvas = document.createElement('canvas');
    canvas.width = x * Tile.sizePxArr[zoom].x;
    canvas.height = y * Tile.sizePxArr[zoom].y;
    return canvas;
};

bckMap.prototype.genSpriteCorner = function(canvas, zoom, clim, mask1, mask2){
    var set = 0;

    canvas.drawImage(this.resLoaded[zoom].c[set], 0, clim * Tile.sizePxArr[zoom].y, Tile.sizePxArr[zoom].x, Tile.sizePxArr[zoom].y, 0, 0, Tile.sizePxArr[zoom].x, Tile.sizePxArr[zoom].y);

    if(mask1){
        canvas.globalCompositeOperation = 'destination-in';
        canvas.drawImage(this.resLoaded[zoom].c.mask, 0, 0, Tile.sizePxArr[zoom].x, Tile.sizePxArr[zoom].y, 0, 0, Tile.sizePxArr[zoom].x, Tile.sizePxArr[zoom].y);
    }

    if(mask2){
        canvas.globalCompositeOperation = 'destination-in';
        canvas.drawImage(this.resLoaded[zoom].c.mask, Tile.sizePxArr[zoom].x, 0, Tile.sizePxArr[zoom].x, Tile.sizePxArr[zoom].y, 0, 0, Tile.sizePxArr[zoom].x, Tile.sizePxArr[zoom].y);
    }

    canvas.globalCompositeOperation = 'source-over';
};

bckMap.prototype.loadResource = function(layerName, resName, callback, opt){
    opt = opt||{};
    
    var self = this,
        zoom = this.getSetForLayerName(layerName);

    var resData = this.tRes[zoom][layerName][resName];

    if ( !resData ){
        console.warn('NotFound: ', zoom, layerName, resName);

        return;
    }
    
    var urls = resData.url;
    
    if( typeof(urls) != 'object' ){
        var res = new Image(); 
        
        this.setRes(zoom, layerName, resName, true);//отмечаем, что ресурс поставлен на загрузку

        this.setLoadResCounter(opt.mark, res);

        res.onload = function(){
            self.setRes(zoom, layerName, resName, this); // Сохраняем данные

            if( callback )
                callback();
            
            if( this.__counter__ )
                this.__counter__.decrease(this);
            
            this.onerror = this.onload = null;
        };
        res.onerror = function(){
            console.warn('failed to load res: ' + this.src + ' (' + layerName + ', ' + resName + ')');

            if( opt.callbackOnError && callback )
                callback();
            
            if( this.__counter__ )
                this.__counter__.decrease(this);
            
            this.onerror = this.onload = null;
        };

        res.src = urls;
    } 
    else{
        this.setRes(zoom, layerName, resName, []);

        function res_loaded(i){
            var res = new Image(); 
            
            self.getRes(layerName, resName, zoom).push(true);//отмечаем, что ресурс поставлен на загрузку
            
            self.setLoadResCounter(opt.mark, res);
            
            res.onload = function(){
                self.getRes(layerName, resName, zoom)[i] = this;//сохраняем данные

                if( callback )
                    callback();

                //делаем паттерн
                if( resData.pattern ){
                    self.patterns[zoom][layerName][resName][i] = self.canvasW.createPattern(this, 'repeat');

                    self.patterns[zoom][layerName][resName][i].src = this.src;
                }
                
                if( this.__counter__ )
                    this.__counter__.decrease(this);
                
                this.onerror = this.onload = null;
            };
            res.onerror = function(){
                console.warn('failed to load res: ' + this.src + ' (' + layerName + ', ' + resName + ')');
                
                if( opt.callbackOnError && callback )
                    callback();
                
                if( this.__counter__ )
                    this.__counter__.decrease(this);
                
                this.onerror = this.onload = null;
            };

            res.src = urls[i];
        }

        //делаем паттерн
        if( resData.pattern ){
            if( !this.patterns[zoom][layerName] )
                this.patterns[zoom][layerName] = {};

            this.patterns[zoom][layerName][resName] = [];
        }

        for(var i in urls)
            res_loaded(i);
    }
};

    bckMap.prototype.setLoadResCounter = function(mark, resource){
        if( !mark )
            return;
        
        this['loadResCounter_' + mark] = (this['loadResCounter_' + mark]||{
            count: 0,
            mark: mark,
            map: this,
            decrease: function(res){
                delete res.__counter__;
                
                if( --this.count > 0 )
                    return;
                
                delete this.map['loadResCounter_' + this.mark];
                
                notifMgr.runEvent(Notif.ids.mapResLoaded, this.mark);
            },
            increase: function(res){
                this.count++;
                
                res.__counter__ = this;
                
                return this;
            }
        }).increase(resource);
    };

bckMap.prototype.drawLoadResource = function(callbackName, delay){
    callbackName = callbackName||'requestRender';

    this.clearTimeout(this['loadResourceTimeout_'+callbackName]);

    this['loadResourceTimeout_'+callbackName] = this.setTimeout(this[callbackName], delay||100);
};


/**
* Подгон размеров карты
*
* @return boolean изменились ли размеры
*/
bckMap.prototype.resize = function(){
    if( !this.canvasTag )
        return;

    this.sizeVpx = this.getViewSize();


    this.canvasTag.width = this.sizeVpx.x;
    this.canvasTag.height = this.sizeVpx.y;
    this.canvasWTag.width = this.sizeVpx.x;
    this.canvasWTag.height = this.sizeVpx.y;

    this.canvas = this.canvasTag.getContext('2d');
    this.canvasW = this.canvasWTag.getContext('2d');

    this.canvasMaskTag.width = this.sizeVpx.x;
    this.canvasMaskTag.height = this.sizeVpx.y;
    this.canvasMask = this.canvasMaskTag.getContext('2d');

    this.canvasMountMaskTag.width = this.sizeVpx.x;
    this.canvasMountMaskTag.height = this.sizeVpx.y;
    this.canvasMountMask = this.canvasMountMaskTag.getContext('2d');

    this.updPos();

    notifMgr.runEvent(Notif.ids.mapIfResize);
};

    bckMap.prototype.updPos = function(){
        this.map.showCenter();
    };

bckMap.prototype.getViewSize = function(){
    return {x: $(document).width(), y: $(document).height()};
};

bckMap.prototype.getPosTMpxByPosTMT = function(posTMT, dispOffset){
    return {
        x: ((posTMT.x - posTMT.y) - (dispOffset ? 1 : 0)) * Tile.dispPxArr[0].x,
        y: ((posTMT.x + posTMT.y) - (dispOffset ? 1 : 0)) * Tile.dispPxArr[0].y
    };
};

/**
* Обновление карты
*
* Подгоняем размер и если он изменился - перезагружаем карту
*/
bckMap.prototype.refresh = function(doResize){
    if( doResize )
        this.resize();

    this.showView();
};



/**
* Перемещение карты на 1 шаг
*
* @param integer(-1..1) x, y - перемещения по координатам.
*/
bckMap.prototype.moveStep = function(x, y){
    var self = this;

    if( !this.map.isMoving ){
        this.map.toggleMove(true);

        //Вычисление начальных и конечных координат
        var mapPos0 = utils.clone(this.posMWpx);
        var mapPosF = {};
        mapPosF.x = Math.round(mapPos0.x-(this.sizeVpx.x * this.map.zoom - this.sizeTpx.x)/2 * x);
        mapPosF.y = Math.round(mapPos0.y-(this.sizeVpx.y * this.map.zoom - this.sizeTpx.y)/2 * y); 

        //задержка между итерациями
        var delay = 10; 
        //общее время анимации
        var tTime = 11;
        //расчет расстояний по координатам
        var V = Math.sqrt(this.sizeMT.y * this.sizeMT.y + this.sizeMT.x * this.sizeMT.x)/2;
        if( x*y != 0 ){
            var k = this.sizeMT.y / this.sizeMT.x;
            var Vx = V / Math.sqrt(k*k+1);
            var Vy = Vx*k;
        }
        else {
            Vx=Vy=V;  
        }

        var start = Date.now();
        var anim = setInterval(function(){
            //Прогресс 0-1
            var prog = (Date.now()-start) / tTime;

            //Вычисление текущих координат
            var mapPos = {
                x: Math.round(mapPos0.x - Vx * x * prog),
                y: Math.round(mapPos0.y - Vy * y * prog)
            };

            if((mapPos.x - mapPosF.x)*x<0)
                mapPos.x = mapPosF.x;
            if((mapPos.y - mapPosF.y)*y<0)
                mapPos.y = mapPosF.y;

            //позиционирование карты 
            self.setPosMWpx(mapPos);

            self.showView();

            //если перемещение завершено
            if (mapPos.x == mapPosF.x && mapPos.y == mapPosF.y) {
                clearInterval(anim);
                self.map.toggleMove(false);

                //установка новых координат
                self.calcPosMWT();

                //вторая часть
                if(self.waitList>0)self.waitList=2;
                else{
                    self.setTimeout(function(){
                        this.move2();
                    }, 30);
                }
            }

            notifMgr.runEvent(Notif.ids.mapMove);
        }, delay);
    }

    return false;
};

bckMap.prototype.calcPosMWT = function(){
    var posMWpxCenter = { //координаты центра области отрисовки
        x: -this.posMWpx.x + this.sizeVpx.x * this.map.zoom / 2,
        y: -this.posMWpx.y + (this.sizeVpx.y + this.sizeTpx.y) * this.map.zoom / 2
    };

    var posMWT = this.getPosTMTByMPx(posMWpxCenter);

    this.map.posMWT.x = posMWT.x;
    this.map.posMWT.y = posMWT.y;
};

bckMap.prototype.setPosMWpx = function(posMWpx){
    this.posMWpx = posMWpx;
};

bckMap.prototype.moveToPx = function(pos){
    pos = {
        x: pos.x + this.sizeVpx.x * 0.5 * this.map.zoom,
        y: pos.y + this.sizeVpx.y * 0.5 * this.map.zoom
    };

    this.setPosMWpx(pos);

    this.showView();
};

/**
* Перемещение карты 2-я часть
*/
bckMap.prototype.move2 = function(){
    this.waitList = 1;
    
    this.setTimeout(this.showView, 200);
};

bckMap.prototype.loadChunks = function(forceUpdateLayers){
    if( this.chunksLoadTimeout )
        return;

    if( !this.hasChunksLoad() ){
        if( !this.firstChunksLoaded ){
            this.firstChunksLoaded = true;
            
            notifMgr.runEvent(Notif.ids.mapChunkLoaded);
        }
        else if( this.updTileSelectAfterChunksLoaded ){
            delete this.updTileSelectAfterChunksLoaded;

            this.map.updTileSelect();
        }
        
        if( this.firstRender )
            this.map.toggleLoadIndicator(false);

        return;
    }
    else
        this.map.toggleLoadIndicator(true);

    var time = timeMgr.getNow();

    this.chunksReqDelayTime = time + Math.max(0, this.chunksReqDelayTime - time);

    this.chunksLoadTimeout = this.setTimeout(function(){
        this.chunksReqDelayTime += this.chunksReqDelay;

        reqMgr.getMapChunks(this.map.posMWT.o, this.getChunksLoadArr(), function(resp){
            notifMgr.runEvent(Notif.ids.reqGetMapChunks, resp);
        });
    }, Math.max(0, (this.chunksReqDelayTime - time) - this.chunksReqLimitTime) * 1000);
};

bckMap.prototype.canPreCacheRoads = function(){
    return !this.firstChunksLoaded && ls.getRoadsCache(true);
};

bckMap.prototype.hasChunksLoad = function(){
    return !!this.chunksLoadArr.length;
};

bckMap.prototype.getChunksLoadArr = function(){
    return this.chunksLoadArr.slice(0, this.maxChunkUpload);
};

bckMap.prototype.prepareChunks = function(data){
    if( !data ){
        this.stopMap();

        this.map.toggleLoadIndicator(false);

        return false;
    }

    var chunks = data.chunks;

    // Сохраняем данные в js массив
    for(var chunkI in chunks){
        var chunk = chunks[chunkI];

        this.cleanChunksLoadArr(chunk);

        var newChunk = this.map.createChunk(chunk);

        this.generateStyles(newChunk);
    }

    this.showView(true);
};

    bckMap.prototype.prepareChunksByWorker = function(data){
        if( !data ){
            this.stopMap();

            this.map.toggleLoadIndicator(false);

            return false;
        }

        this.inWorker = true;

        reqMgr.prepareChunks({
            chunks: data.chunks, 
            map: this.getWorkerMapData(),
            world: utils.cloneBase({
                towns: data.towns||{},
                accounts: data.accounts||{},
                countries: data.countries||{}
            })
        }, function(resp){
            notifMgr.runEvent(Notif.ids.workerMapChunks, resp);
        });
    };
    
        bckMap.prototype.getWorkerMapData = function(){
            return {
                sizeTpx: this.sizeTpx, 
                imgSets: this.imgSets, 
                tResRoads: this.tRes[0]['road']
            };
        };
    
bckMap.prototype.toggleMap = function(){
    this.clearTimeout(this.toggleMapTO);

    this.toggleMapTO = this.setTimeout(function(){
        this.cont.removeClass('-state-hidden');

        this.toggleMap = function(){};
    }, 100);
};


bckMap.prototype.preCacheRoads = function(tile){
    // Производим предварительный кеш дорог только при пепрвой загрузке чанков
    if( this.firstChunksLoaded )
        return;

    var roads = tile[Tile.param.layers].road;

    for(var road in roads){
        road = roads[road];

        road.cache = {};

        road.posTMT = tile[Tile.param.posTMT];
        road.posTMpx = tile[Tile.param.posTMpx];
        road.tile = tile;
        
        this.roadsListForPreCache.push(road);
    }
};

bckMap.prototype.preCacheRoadsSync = function(){
    for(var i = 0; i < this.roadsListForPreCache.length; i++){
        this.preCacheRoadSync(this.roadsListForPreCache[i]);
    }

    delete this.roadsListForPreCache;
};

    bckMap.prototype.preCacheRoadSync = function(roadInfo, resInfo){
        //console.time('preCacheRoadSync_road_' + roadInfo.type);
        
        var roadImg = new Image(),
            layer = roadInfo.type == Road.ids.tunnel ? 'pike_road' : 'road',
            flag;
            
        resInfo = resInfo||this.tRes[0][layer][roadInfo.type];
        
        //console.timeEnd('renderRoadTile_pass_0_road_' + roadInfo.type);
        flag = this.renderRoadTile(roadInfo, 0, resInfo, false, layer);
        //console.timeEnd('renderRoadTile_pass_0_road_' + roadInfo.type);
        
        if( flag ){
            //console.timeEnd('canvasRoadTag_pass_0_road_' + roadInfo.type);
            roadImg.src = this.canvasRoadTag.toDataURL();
            //console.timeEnd('canvasRoadTag_pass_0_road_' + roadInfo.type);

            roadInfo.cache[0] = roadImg;
        }

        roadImg = new Image();
        
        //console.timeEnd('renderRoadTile_pass_1_road_' + roadInfo.type);
        flag = this.renderRoadTile(roadInfo, 1, resInfo, false, layer);
        //console.timeEnd('renderRoadTile_pass_1_road_' + roadInfo.type);
        
        if( flag ){
            //console.timeEnd('toDataURL_pass_1_road_' + roadInfo.type);
            roadImg.src = this.canvasRoadTag.toDataURL();
            //console.timeEnd('toDataURL_pass_1_road_' + roadInfo.type);
            
            roadInfo.cache[1] = roadImg;
        }
        
        //console.timeEnd('preCacheRoadSync_road_' + roadInfo.type);
    };
    
bckMap.prototype.preCacheRoadsAsync = function(){
    console.time('preCacheRoadsAsync');
    
    this.roadCacheIndex = 0;

    this.preCacheRoadAsync(0);
};

    bckMap.prototype.preCacheRoadAsync = function(pass){
        var self = this,
            road = this.roadsListForPreCache[this.roadCacheIndex],
            resInfo = this.tRes[0]['road'][road.type];
        
        if( !this.renderRoadTile(road, pass, resInfo, false, 'road') ){
            this.preCacheRoadAsyncComplete(pass);

            return;
        }

        createImageBitmap(this.canvasRoadTag).then(
            function(roadImg){
                roadImg.complete = true;

                road.cache[pass] = roadImg;

                self.preCacheRoadAsyncComplete(pass, road);
            }, function(){
                self.preCacheRoadAsyncComplete(pass);
            });
    };

    bckMap.prototype.preCacheRoadAsyncComplete = function(pass, road){
        if( pass ){
            if( road && road.cache[0] )
                road.roads.length = 0;

            this.roadCacheIndex++;
        }

        if( this.roadsListForPreCache.length > this.roadCacheIndex )
            this.preCacheRoadAsync(+!pass);
        else
            this.preCacheRoadsComplete();
    };

bckMap.prototype.preCacheRoadsComplete = function(){
    console.timeEnd('preCacheRoadsAsync');
    
    delete this.roadsListForPreCache;

    this.map.showView();
};


bckMap.prototype.cleanChunksLoadArr = function(chunk){
    var self = this;

    this.isChunkInArray(chunk, this.chunksLoadArr, function(index){
        self.chunksLoadArr.splice(index, 1);
    });
};

bckMap.prototype.setStorageData = function(){
    try{
        sessionStorage.world = JSON.stringify(wofh.world.prepareToStorage(this.world));
    }
    catch(e){
    }

    delete this.world;
};

bckMap.prototype.getStorageData = function(){
    try{
        set.world.add(JSON.parse(sessionStorage.world||'{}'));
    }
    catch(e){
    }
};

bckMap.prototype.stopMap = function(){
    wndMgr.addAlert('Некорректные данные, перезагрузите страницу').onClose = function(){
        location.href = 'map';
    };

    this.map.stopped = true;
};

bckMap.prototype.isChunkInArray = function(chunk, array, callback){
    for(var i in array){
        if(chunk.x == array[i].x && chunk.y == array[i].y){
            if( callback ) callback(i, array[i]);

            return true;
        }
    }
    return false;
};

//разбиваем чанки, которые нужно отобразить по группам
bckMap.prototype.getChunksNeedLoad = function(){
    this.chunksLoadArr = []; // Массив чанков, требующих загрузки

    var chunks = this.getViewChunks();

    //подготавливаем чанки из хранилища к отображению
//		this.prepareChunksFromStorage(chunks);

    //чанки, которые можно показать сразу
    var show = [];

    for(var i = 0; i < chunks.length; i++){
        var chunk = chunks[i];

        var chunkData = this.map.getChunk(chunk);

        if( !chunkData || this.map.upd > chunkData.upd || chunkData.system )
            this.chunksLoadArr.push(chunk);

        if( chunkData && !chunkData.system )
            show.push(chunk);
    }

    return show;
};

bckMap.prototype.checkChunksShown = function(chunks){
    chunks = utils.clone(chunks);

    for(var chunk in this.chunksShown){
        this.isChunkInArray(this.chunksShown[chunk], chunks, function(index){
            chunks.splice(index, 1);
        });
    }

    return chunks;
};

//получаем код окрестности (холмов, шахт и т.п.) для тайла
//данные по окрестности считаем по функции, которая получает тайл и выдает наличие в нем объекта(холма, шахты и т.п.)
bckMap.prototype.calcTileAmbit = function(tile, func, tiles){
    var ambitCoors = [
        {x: tile[Tile.param.posTMT].x - 1, y: tile[Tile.param.posTMT].y - 1},
        {x: tile[Tile.param.posTMT].x - 1, y: tile[Tile.param.posTMT].y},
        {x: tile[Tile.param.posTMT].x, y: tile[Tile.param.posTMT].y - 1}
    ];

    tiles = tiles||[
        this.map.getTile(ambitCoors[0]),
        this.map.getTile(ambitCoors[1]),
        this.map.getTile(ambitCoors[2])
    ];

    var result = func(tile, tile[Tile.param.posTMT]) ? 1 : 0;

    if( func(tiles[0], ambitCoors[0]) ) result += 2;
    if( func(tiles[1], ambitCoors[1]) ) result += 4;
    if( func(tiles[2], ambitCoors[2]) ) result += 8;

    return result;
};

bckMap.prototype.calcTileWaterAmbit = function(tileC, opt){
    opt = opt||{};

    var self = this,
        i = -2; // Счетчик итираций исключающий текущий тайл

    return this.calcTileAmbit(tileC, function(tile, tilePosTMT){
        i++;

        if( !tile ) {
            // Если соседний тайл неизвестен достаём информацию о его климате из текущего тайла
            if( i >= 0 && opt.norm ){
                tile = [];

                tile[Tile.param.climate] = opt.norm[i]+1;
                tile[Tile.param.low_water] = 0;

                if( tile[Tile.param.climate] == Tile.climateIds.water ){
                    tile[Tile.param.low_water] = 0;

                    if( (tileC && tileC[Tile.param.climate] != Tile.climateIds.water) || 
                        (i == 0 && (opt.norm[1] != Tile.climateIds.water-1 || opt.norm[2] != Tile.climateIds.water-1)) ||
                        opt.norm[0] != Tile.climateIds.water-1
                    ){
                        tile[Tile.param.low_water] = 1;
                    }

                    if( !tile[Tile.param.low_water] ){
                        tile[Tile.param.posTMT] = tilePosTMT;

                        for(var dir in Tile.dirsMap){
                            var nextTile = self.map.getTileByDir(tile[Tile.param.posTMT], dir);

                            if( !nextTile )
                                continue;

                            if( nextTile[Tile.param.climate] != Tile.climateIds.water ){
                                tile[Tile.param.low_water] = 1;

                                break;
                            }
                        }
                    }
                }
            }
            else
                return 0;
        }

        var lowwater = tile[Tile.param.low_water],
            clim = tile[Tile.param.climate]-1;

        if(!lowwater && clim == 0) return 1;

        return 0;
    }, opt.tiles);
};

//получаем код окрестности всесоседи
bckMap.prototype.calcTileRel = function(tile, func, range){
    range = range || Tile.dirsMap;

    var result = 0;
    for (var dir in range){
        result += func(this.map.getTileByDir(tile[Tile.param.posTMT], dir));
    }

    return result;
};

bckMap.prototype.getTilesDisp = function(tilePosA, tilePosB, abs){
    if(!tilePosB) tilePosB = wofh.town.pos;
    var disp = {
        dx: tilePosA.x - tilePosB.x,
        dy: tilePosA.y - tilePosB.y
    }
    if(tilePosA.o && tilePosB.o && tilePosA.o != tilePosB.o){
        disp.dx += this.dispMMT.x;
        disp.dy += this.dispMMT.y;
    }
    if(abs){
        disp.dx = Math.abs(disp.dx);
        disp.dy = Math.abs(disp.dy);
    }
    return disp;
}

bckMap.prototype.getTileDir = function(tilePosA, tilePosB){
    var disp = this.getTilesDisp(tilePosA, tilePosB, false);

    for(var dir in Tile.dirsMap){
        if(Tile.dirsMap[dir].x == disp.dx && Tile.dirsMap[dir].y == disp.dy)
            return +dir;
    }

    return -1;
};

var REL_FAR = 0;
var REL_DIAG = 1;
var REL_NEXT = 2;
var REL_SAME = 3;

bckMap.prototype.getTilesRelation = function(tilePosA, tilePosB){
    var disp = this.getTilesDisp(tilePosA, tilePosB, true);
    if(disp.dx>1 || disp.dy>1) return REL_FAR;
    if(disp.dx==1 && disp.dy==1) return REL_DIAG;
    if(disp.dx==0 && disp.dy==0) return REL_SAME;
    return REL_NEXT;
}

bckMap.prototype.canBuildInMode = function(tile, mode){
    switch(mode){
        case 'town':
            if(this.map.getFoundTownErrors(tile, {colonists: true})){
                return false;
            }
            break;
        case 'road':
            if(!this.canBuildRoadInTile(tile)){
                return false;
            }
            break;
        case 'env0':/*bridge*/
        case 'env1':/*irregation*/
        case 'env2':/*mine*/
        case 'env3':/*campus*/
        case 'env4':/*fair*/
        case 'env5':/*watermill*/
        case 'env6':
        case 'env7':
        case 'env8':
        case 'env9':
            var envId = +mode[3];
            if( !Tile.canBuildImp(envId, tile, this.map).isOk() ){
                return false;
            }
            break;
    }
    return true;
};


bckMap.prototype.drawArea = function(cls, clsId){
    var self = this;

    if( cls == 'aad' )
        this.auraTowns = wofh.towns;
    if ( cls == 'cnt' || cls == 'aadc' ) {
        this.auraTowns = wofh.towns;

        if( !this.waitCountryTowns && wofh.country && (wofh.account.isHead() || (cls == 'aadc' && wofh.account.isMarshal())) ){
            if( !this.countryTowns ){
                this.waitCountryTowns = true;

                reqMgr.getCountryTowns(function(resp){
                    notifMgr.runEvent(Notif.ids.reqGetCountryTowns, resp);
                });
            }
            else
                this.auraTowns = this.countryTowns;
        }
    }

    var stylePurple = "rgba(127, 0, 255, 0.33)";
    var styleOrange = "rgba(255, 127, 0, 0.33)";
    var styleRed = "rgba(255, 0, 0, 0.33)";
    var styleGreen = "rgba(0, 255, 0, 0.33)";
    var styleYellow = "rgba(255, 255, 0, 0.33)";
    var styleBlue = "rgba(0, 204, 255, 0.33)";
    var styleAquamarine = "rgba(126, 255, 212, 0.33)";

    switch(cls){
        case 'town'://красные
        case 'road':
            this.canvas.fillStyle = styleRed;
            break;
        case 'trw':
            this.canvas.fillStyle = stylePurple;
            break;
        case 'cnt':
            this.canvas.fillStyle = styleOrange;
            break;
        case 'env'://зелёные
        case 'air':
            this.canvas.fillStyle = styleGreen;
            break;
        case 'aad':
            this.canvas.fillStyle = styleBlue;
            break;
        case 'aadc':
            this.canvas.fillStyle = styleAquamarine;
            break;			
    }

    this.iterateShownTiles(function(tile){
        var drawBase = self.calcDrawBase(tile[Tile.param.posTMpx]);

        if( !self.isTileVisible(drawBase) ) return;

        switch(cls){
            case 'town':
                var maxDist = lib.map.colonizedistance;
                if(Trade.calcMapDistance(wofh.town.pos, tile[Tile.param.posTMT]) <= maxDist){
                    self.canvas.fillStyle = self.canBuildInMode(tile, cls) ? styleGreen : styleRed;
                    self.drawTileBox(drawBase);
                }
                break;
            case 'road':
                if(!self.canBuildInMode(tile, cls)){
                    self.drawTileBox(drawBase);
                }
                break;
            case 'env':
                var imp = new MapImp(clsId),
                    cond = imp.getCondition(),
                    err = Tile.canBuildImp(imp.getId(), tile, self.map),
                    style;

                if (!err.has(MapImp.buildErr.relief) && !err.has(MapImp.buildErr.science) && !err.has(MapImp.buildErr.level)) {
                    if (err.has(MapImp.buildErr.distance)) {
                        style = styleBlue;
                    }else {
                        style = utils.sizeOf(Tile.getTileImpConflict(tile, imp)) ? styleYellow : styleGreen;
                    }
                }
                else if( cond.closeToTown && !err.has(MapImp.buildErr.distance) ){
                    if( err.has(MapImp.buildErr.relief) )
                        style = styleRed;
                    else
                        style = styleOrange;
                }

                if( style ){
                    self.canvas.fillStyle = style;

                    self.drawTileBox(drawBase);
                }

                break;
            case 'trw':
                if (tile[Tile.param.climate] == Tile.climateIds.water) return;

                if (self.map.canTradeTileByWater(tile)) {
                    self.drawTileBox(drawBase);
                }

                break;
            case 'aad':
            case 'aadc':
            case 'cnt':
                var maxDist;
                if(cls=='aad' || cls=='aadc') maxDist = lib.war.aaradius;
                if(cls=='cnt') maxDist = lib.country.joindistance;
                for (var town in self.auraTowns) {
                    town = self.auraTowns[town];

                    if( Trade.calcMapDistance(town.pos, tile[Tile.param.posTMT]) <= maxDist ){
                        self.drawTileBox(drawBase);

                        return;
                    }
                }
                break;
            case 'air':
                for (var range = 0; range < lib.war.airradius.length; range++){
                    var find = false;
                    for (var town in wofh.towns) {
                        town = wofh.towns[town];
                        var dist = Trade.calcMapDistance(town.pos, tile[Tile.param.posTMT]);
                        if (dist <= lib.war.airradius[range]){
                            self.canvas.fillStyle = 'rgba(0, '+(range*50)+', 255, 0.33)';
                            self.drawTileBox(drawBase);
                            find = true;
                            break;
                        }
                    }
                    if (find) break;
                }
                break;
        }
    });
};

bckMap.prototype.drawTileText = function(tile, text){
    var drawBase = this.calcDrawBase(tile[Tile.param.posTMpx]);
    if(!this.isTileVisible(drawBase))return;

    drawBase.x += 10;
    drawBase.y += this.sizeTpx.y * 0.7 / this.map.zoom + 5;

    this.canvas.fillStyle = '#000';
    this.canvas.fillRect(drawBase.x, drawBase.y, 19, -8)
    this.canvas.fillStyle = '#aaaaaa';
    this.canvas.fillText(text, drawBase.x, drawBase.y);
};

bckMap.prototype.drawVector = function(tile, town, opt){
    opt = opt||{};
    opt.color = opt.color||'#000';
    opt.lineWidth = opt.lineWidth||1;

    if( !opt.noModeCheck && !this.canBuildInMode(tile, this.map.mode.subtype) ) 
        return;

    var destBase = this.calcDrawBase(tile[Tile.param.posTMpx]);

    destBase.x += Tile.sizePxArr[0].x / 2 / this.map.zoom;
    destBase.y += (Tile.sizePxArr[0].y / 2 + this.getDrawBaseDispClimPx_y()) / this.map.zoom;

    var tileTMT = tile[Tile.param.posTMT],
        targetPoint;

    if( opt.tile )
        targetPoint = opt.tile[Tile.param.posTMT];
    else{
        town = town||wofh.town;

        targetPoint = town.pos;
    }

    var dispT = {
            x: (tileTMT.x - targetPoint.x) / this.map.zoom,
            y: (tileTMT.y - targetPoint.y) / this.map.zoom
        },
        dispPx = this.getPosTMpxByPosTMT(dispT),
        canvas = opt.canvas||this.canvas;

    canvas.strokeStyle = opt.color;
    canvas.lineWidth = opt.lineWidth;

    canvas.beginPath();
    canvas.moveTo(destBase.x, destBase.y);
    canvas.lineTo(destBase.x - dispPx.x, destBase.y - dispPx.y);
    canvas.stroke();
    canvas.closePath();
};



bckMap.prototype.drawConstructTileRoads = function(){
    if( !this.map.tileSelect.roadDirs )
        return;
    
    var tile = this.cloneTile(this.map.tileSelect.tile);

    var drawBase = this.calcDrawBase(tile[Tile.param.posTMpx]);

    for(var dir in this.map.tileSelect.roadDirs){
        dir = +dir;

        var roadType = this.map.tileSelect.roadDirs[dir];

        if( roadType == 0 )
            continue;
        
        var nextTile = this.cloneTile(this.map.getTileByDir(tile[Tile.param.posTMT], dir)),
            drawBaseNext = this.calcDrawBase(nextTile[Tile.param.posTMpx]),
            selDir = this.map.tileHover.posTMT.x == nextTile[Tile.param.posTMT].x && this.map.tileHover.posTMT.y == nextTile[Tile.param.posTMT].y,
            layerName = selDir ? 'road' : 'road_bld',
            isMountainRoad = Tile.isMountains(tile) || Tile.isMountains(nextTile);
            
        this.drawConstructTileRoad(tile, drawBase, nextTile, drawBaseNext, dir, selDir, roadType, layerName, isMountainRoad);
    }
};

    bckMap.prototype.drawConstructTileRoad = function(tile, drawBase, nextTile, drawBaseNext, dir, selDir, roadType, layerName, isMountainRoad){
        var road;
        
        // Дорога основного тайла

        if( isMountainRoad ){
            if( Tile.isMountains(tile) ){
                roadType = Road.ids.tunnel;

                if( selDir )
                    layerName = 'pike_road';
            }
            else
                roadType = Road.ids.railway;
        }

        Tile.initRoadLayers(tile);

        if( Tile.tileRiverCount(tile) )
            road = {endPoints: {from: dir, ford: this.calcRiverFord(tile, dir)}};
        else
            road = {endPoints: {from: 8, to: dir}};

        this.calcRoad(tile, road, roadType, true);

        for(var step=1; step>=0; step--)
            this.drawRoad(this.canvas, layerName, road, roadType, step, drawBase);

        // Дорога примыкающего тайла
        if( isMountainRoad ){
            if( Tile.isMountains(nextTile) ){
                roadType = Road.ids.tunnel;

                if( selDir )
                    layerName = 'pike_road';
            }
            else{
                roadType = Road.ids.railway;

                layerName = selDir ? 'road' : 'road_bld';
            }
        }

        Tile.initRoadLayers(nextTile);

        if( Tile.tileRiverCount(nextTile) )
            road = {endPoints: {from: this.invDir(dir), ford: this.calcRiverFord(nextTile, this.invDir(dir))}};
        else
            road = {endPoints: {from: 8, to: this.invDir(dir)}};

        this.calcRoad(nextTile, road, roadType, true);

        for(var step=1; step>=0; step--)
            this.drawRoad(this.canvas, layerName, road, roadType, step, drawBaseNext);

        // Рисуем арку тоннеля
        if( isMountainRoad && !(Tile.isMountains(tile) && Tile.isMountains(nextTile)) ){
            var tileInfo;

            if( Tile.isMountains(tile) )
                tileInfo = {x: dir, tile: tile,	drawBase: drawBase};
            else
                tileInfo = {x: this.invDir(dir), tile: nextTile, drawBase: drawBaseNext};

            this.drawConstructTunnelArches(this.canvas, 'road_bld', tileInfo);
        }
    };

bckMap.prototype.drawConstructRoads = function(canvas, tile, dir, roadType, layerName, drawBase){	
    //примыкающий тайл
    var nextTile = this.map.getTileByDir(tile[Tile.param.posTMT], dir);

    if( !nextTile ) 
        return;

    nextTile = this.cloneTile(nextTile);

    drawBase = drawBase||this.calcDrawBase(tile[Tile.param.posTMpx]);

    var drawBaseNext = this.calcDrawBase(nextTile[Tile.param.posTMpx]),
        isMountainRoad = Tile.isMountains(tile) || Tile.isMountains(nextTile);

    if( layerName == 'env_ph' && this.isTileHidden(drawBase) && this.isTileHidden(drawBaseNext) )
        return;
    
    this.drawConstructRoad(canvas, tile, dir, roadType, layerName, drawBase, nextTile, drawBaseNext, isMountainRoad);
};

    bckMap.prototype.drawConstructRoad = function(canvas, tile, dir, roadType, layerName, drawBase, nextTile, drawBaseNext, isMountainRoad){
        var road;

        // Дорога основного тайла

        if( isMountainRoad )
            roadType = Tile.isMountains(tile) ? Road.ids.tunnel : Road.ids.railway;

        if( Tile.tileRiverCount(tile) )
            road = {endPoints: {from: dir, ford: this.calcRiverFord(tile, dir)}};
        else
            road = {endPoints: {from: 8, to: dir}};

        this.calcRoad(tile, road, roadType, true);

        for(var step=1; step>=0; step--)
            this.drawRoad(canvas, layerName, road, roadType, step, drawBase);

        //дорога примыкающего тайла
        if( isMountainRoad )
            roadType = Tile.isMountains(nextTile) ? Road.ids.tunnel : Road.ids.railway;

        Tile.initRoadLayers(nextTile);

        if (Tile.tileRiverCount(nextTile) )
            road = {endPoints: {from: this.invDir(dir), ford: this.calcRiverFord(nextTile, this.invDir(dir))}};
        else
            road = {endPoints: {from: 8, to: this.invDir(dir)}};

        this.calcRoad(nextTile, road, roadType, true);

        for(var step=1; step>=0; step--)
            this.drawRoad(canvas, layerName, road, roadType, step, drawBaseNext);

        // Рисуем арку тоннеля
        if( isMountainRoad && !(Tile.isMountains(tile) && Tile.isMountains(nextTile)) ){
            var tileInfo;

            if( Tile.isMountains(tile) )
                tileInfo = {x: dir, tile: tile,	drawBase: drawBase};
            else
                tileInfo = {x: this.invDir(dir), tile: nextTile, drawBase: drawBaseNext};

            this.drawConstructTunnelArches(canvas, 'env_ph', tileInfo);
        }
    };

bckMap.prototype.drawConstructTunnelArches = function(canvas, layerName, tileInfo){
    var img = this.getOrLoadRes(layerName, 'tunnel_arches');

    if (!img) return;

    this.drawImage(
        canvas,
        img,
        tileInfo.x * this.tileWide.sizePx.x,
        (tileInfo.tile[Tile.param.climate]-2) * this.tileWide.sizePx.y,
        this.tileWide.sizePx.x,
        this.tileWide.sizePx.y,
        tileInfo.drawBase.x + ((tileInfo.x==(window.dirTest||-1)?(window.offsetTestX||0):0)) + this.tileWide.dispPx.x / this.drawZoom,
        tileInfo.drawBase.y + ((tileInfo.y==(window.dirTest||-1)?(window.offsetTestY||0):0)) + this.tileWide.dispPx.y / this.drawZoom,
        this.tileWide.sizePx.x / this.drawZoom,
        this.tileWide.sizePx.y / this.drawZoom);
};

bckMap.prototype.drawConstruct = function(canvas, tile, impCls, impId, layerName, check, drawBase){
    if( !tile )
        return;

    var img;

    if(impCls == 'explore') {
        img = this.getOrLoadRes(layerName, impCls);
    } else if (impCls == 'town') {
        img = this.getOrLoadRes(layerName, impCls);
    } else if (impCls == 'dep') {
        img = this.getOrLoadRes(layerName, 'res_'+utils.twoDigits(impId));
    } else {
        var imp = new MapImp(impId);
        var level = Tile.getTileImpLevel(tile, imp.getId())||1;

        if( imp.getDisplay().useClimate && this.allowImpClimate() ){
            if( tile[Tile.param.climate] == Tile.climateIds.water || tile[Tile.param.climate] == Tile.climateIds.deepwater )
                return;
            
            img = this.getOrLoadRes(layerName, 'env'+imp.getId()+'_'+tile[Tile.param.climate]+level);
        }
        else if( imp.isLikeBridge() )
            img = this.getOrLoadRes(layerName, 'env'+imp.getId()+'_1');
        else
            img = this.getOrLoadRes(layerName, 'env'+imp.getId()+'_'+level);
    }

    if( !img ) 
        return;

    if (check) {
        switch (impCls){
            case 'town':
                if(this.map.getFoundTownErrors(tile, {colonists: true})) return;
                break;
            case 'env':
                var envId = impId;
                if (!Tile.canBuildImp(envId, tile, this.map).isOk()) return;
                break;
        }	
    }

    drawBase = drawBase||this.calcDrawBase(tile[Tile.param.posTMpx], impCls == 'explore');

    if(impCls == 'env' && impId == 0){
        var bridgeData = this.calcBridge(tile, 0);

        bridgeData.maxRoad++;
        this.drawBridge(canvas, bridgeData, drawBase, img);
    } else if(impCls == 'env' && impId == 5){
        var bridgeData = this.calcWaterMill(tile);

        this.drawBridge(canvas, bridgeData, drawBase, img);
    } else if(impCls == 'explore'){
        var alpha = canvas.globalAlpha;

        canvas.globalAlpha = 0.5;
        this.drawImage(canvas,	img, 691, 1, 46, 46, drawBase.x - 23, drawBase.y - 23, 46, 46);
        canvas.globalAlpha = alpha;
    } else {
        this.drawImage(
            canvas,
            img,
            0,
            0,
            this.tileWide.sizePx.x,
            this.tileWide.sizePx.y,
            drawBase.x + this.getDrawConstructDispPx(impCls).x / this.drawZoom,
            drawBase.y + this.getDrawConstructDispPx(impCls).y / this.drawZoom,
            this.tileWide.sizePx.x / this.drawZoom,
            this.tileWide.sizePx.y / this.drawZoom);
    }
};
    
    bckMap.prototype.allowImpClimate = function(){
        return true;
    };
    
    bckMap.prototype.getDrawConstructDispPx = function(impCls){
        return this.tileWide.dispPx;
    };

bckMap.prototype.drawTileBox = function(drawBase){
    this.canvas.save();
    this.canvas.translate(drawBase.x, drawBase.y + this.getDrawBaseDispClimPx_y() / this.map.zoom);
    this.canvas.beginPath();

    this.canvas.moveTo(
        this.sizeTpx.x / this.drawZoom / 2, 
        0);
    this.canvas.lineTo(
        this.sizeTpx.x / this.drawZoom, 
        this.sizeTpx.y / this.drawZoom / 2);
    this.canvas.lineTo(
        this.sizeTpx.x / this.drawZoom / 2, 
        this.sizeTpx.y / this.drawZoom);
    this.canvas.lineTo(
        0, 
        this.sizeTpx.y / this.drawZoom / 2);

    this.canvas.fill();
    this.canvas.restore();
};

bckMap.prototype.sameTile = function(posTMT1, posTMT2){
    return posTMT1.x == posTMT2.x && posTMT1.y == posTMT2.y;
};

//********************** //
// ***** ИНТЕРФЕЙС ***** //
//********************** //

bckMap.prototype.loadInterfaceRes = function(){
    this.getOrLoadRes('focus', 0);

    this.getOrLoadRes('grid', 'cln');
};

bckMap.prototype.setTileHover = function(e, forceSet){
    var posTMT = this.getPosTMTByMouse(e),
        tile = this.map.getTile(posTMT);

    if( !tile || !tile.length ) return false;

    if( !forceSet && this.map.tileHover && this.map.tileHover.posTMT.x == posTMT.x && this.map.tileHover.posTMT.y == posTMT.y )
        return false;

    this.map.tileHover = {
        tile: tile,
        posTMT: posTMT
    };

    return true;
};

/*главный щелкунчик по тайлу*/
bckMap.prototype.onClickTile = function(tile, move) {
    if( !(tile && tile.length && this.firstChunksLoaded) )
        return;

    //специальные действия
    if(!move){
        if(this.map.mode.type == iMap.mode.type.build){
            switch(this.map.mode.subtype){
                case 'road':
                    var dir = this.getTileDir(tile[Tile.param.posTMT], this.map.tileSelect.posTMT),
                        roadDirs = this.map.tileSelect.getRealRoadDirs();

                    if(dir != -1 && roadDirs){
                        var roadType = roadDirs[dir];

                        if( roadType != 0 ){
                            this.map.tileSelect.dir = dir;

                            this.map.tileSelect.roadType = roadType;

                            this.map.showActionsPopup('roadBuild');

                            return;
                        }
                    }

                    break;
            }
        }
    }

    //основное действие - выделение тайла
    if(this.map.tileSelect && tile[Tile.param.posTMT].x == this.map.tileSelect.posTMT.x && tile[Tile.param.posTMT].y == this.map.tileSelect.posTMT.y )
        this.tileInfoRecieved();
    else 
        this.map.selectTile(tile, this.tileInfoRecieved.bind(this));

    this.setMode();

    notifMgr.runEvent(Notif.ids.mapTileSelect);

    //вычисление связей улучшений
    this.calcImpLinks();

    this.drawHighCanvas();
};

bckMap.prototype.showModalHover = function(){
    if(this.map.mode.type == iMap.mode.type.build){
        //город
        switch(this.map.mode.subtype){
            case 'road':
                this.calcTileHoverRoad();
                break;
            case 'env':
                //расчёт времени
                var dist = Trade.calcMapDistance(wofh.town.pos, this.map.tileHover.posTMT);
                var time = utils.servRound(dist / lib.units.list[Unit.ids.worker].speed)||lib.map.minenvmovetime;

                //расчёт улучшения
                var imp = Tile.getTileImpUp(this.map.tileHover.tile, this.map.mode.subid);
                if (!imp) imp = new MapImp(this.map.mode.subid, 1);

                //вывод
                $('.map_mode_imp_panel.'+this.map.mode.subtype+this.map.mode.subid).html(tmplMgr.iMap.mapTL.mode.modeImp({imp:imp, time: time}));

                break;
        }
    }
};

bckMap.prototype.calcTileHoverRoad = function(){
    var dir = this.getTileDir(this.map.tileHover.posTMT, this.map.tileSelect.posTMT)

    this.map.tileSelect.dir = dir;

    var roadDirs = this.map.tileSelect.getRealRoadDirs();

    if( !roadDirs ) return;

    if( dir != -1 ){
        var road = roadDirs[dir];

        this.map.tileSelect.roadType = road;
    }
    else
        delete this.map.tileSelect.roadType;
};

//реакция на смену режима
bckMap.prototype.setMode = function(){
    if(this.map.mode.type == iMap.mode.type.build){
        //город
        if(this.map.mode.subtype == 'road'){
            this.calcConstructNewRoads();	
        }
    }

    this.drawHighCanvas();
};

/*Действия во время начала перемещения*/
bckMap.prototype.mapStartMoving = function(){
    this.removeTooltip();
};

bckMap.prototype.tileInfoRecieved = function(){
    if(this.map.mode.type == iMap.mode.type.build && this.map.mode.subtype != 'road'){
        this.map.showActionsPopup('impBuild');
    }
};

//фокус на тайле
bckMap.prototype.drawFocus = function(type, posTMT){
    var img = this.getOrLoadRes('focus', 0);

    if(!img) return;

    var posTMpx = this.getPosTMpxByPosTMT(posTMT);

    this.drawImage(
        this.canvas,
        img,
        type * this.tileWide.sizePx.x,
        0,
        this.tileWide.sizePx.x,
        this.tileWide.sizePx.y,
        (posTMpx.x + this.posMWpx.x - Tile.dispPxArr[0].x) / this.map.zoom + this.tileWide.dispPx.x / this.drawZoom,
        (posTMpx.y + this.posMWpx.y - Tile.dispPxArr[0].y) / this.map.zoom + this.tileWide.dispPx.y / this.drawZoom,
        this.tileWide.sizePx.x / this.drawZoom,
        this.tileWide.sizePx.y / this.drawZoom);
};

bckMap.prototype.showHover = function(){
    if( typeof(this.getRes('focus', 0)) != 'object' ) return;

    if( this.map.tileHover )
        this.drawFocus(0, this.map.tileHover.posTMT);
};

bckMap.prototype.drawHighCanvas = function(){
    this.clearHighCanvas();

    if( this.map.clrMapScr ) return;

    // Вызывает перересовку верхнего слоя, если при его отрисовке был загружен новый ресурс
    this.globalLoadResourceCallback = this.drawLoadResourceHighCanvas.bind(this);

    if( this.map.tileSelect ){
        //фокус
        this.drawFocus(1, this.map.tileSelect.posTMT);

        //фильтры
        this.drawFilterColonization();//колонизации
        this.drawFilterImprovements();//улучшения
        //аура
        for(var aura in this.map.activeAura){
            if(this.map.activeAura[aura])
                this.drawArea(aura);
        }
    }

    this.showHover();

    if( this.map.tileHighlight && (!this.map.tileSelect || !Tile.isSamePos(this.map.tileSelect.posTMT, this.map.tileHighlight.posTMT)) ){
        // Подсвечиваем центрированный тайл
        this.drawFocus(2, this.map.tileHighlight.posTMT);
    }

    //подрежимы
    if( this.map.mode.type == iMap.mode.type.build ){
        if( this.map.mode.subtype=='road' ){
            if( this.isLayerLoaded('road_bld') && this.map.tileSelect ){
                this.drawArea('road');
                this.drawConstructTileRoads();
                this.drawVector(this.map.tileSelect.tile);
            }
        } else if(this.map.mode.subtype){
            this.drawArea(this.map.mode.subtype, this.map.mode.subid);

            if(this.map.tileHover){
                this.drawConstruct(this.canvas, this.map.tileHover.tile, this.map.mode.subtype, this.map.mode.subid, 'env_bld', true);

                this.drawVector(this.map.tileHover.tile);
            }
        }
    } 
    else{
        if( this.map.mode.type == iMap.mode.type.makeRoute ){
            if( this.map.mapRoutes && this.map.mapRoutes.dataLoading ){
                this.drawRouteDist(this.canvas, this.map.mapRoutes.from, this.map.mapRoutes.to);
            }
            else if( this.map.tileHover )
                this.drawRouteDist(this.canvas, this.map.tileRoutes, this.map.tileHover);
        }

        this.showImpLinks();
    }

    this.drawEvents(this.canvas);

    //связи улучшений
    this.drawDepLines(this.canvas);		

    // Удаляем глобальную функцию обратного вызова, чтобы не вызывался drawHighCanvas если ресурс загружается внутри другой функциии
    delete this.globalLoadResourceCallback;
};

bckMap.prototype.clearHighCanvas = function(){
    this.canvas.clearRect(0, 0, this.sizeVpx.x, this.sizeVpx.y);
};

bckMap.prototype.drawLoadResourceHighCanvas = function(){
    this.drawLoadResource('drawHighCanvas');
};

bckMap.prototype.drawFilterColonization = function(){
    if (+this.map.settings.p_iface[LS.mapIFace.colonization]!=1) return;

    var img = this.getOrLoadRes('grid', 'cln');

    if(!img) return;

    var drawBase = this.calcDrawBase(this.map.tileSelect.tile[Tile.param.posTMpx]);

    this.drawImage(
        this.canvas,
        img,
        0,
        0,
        this.sizeClnFilter.x / this.imgZoom,
        this.sizeClnFilter.y / this.imgZoom,
        drawBase.x + (-this.sizeTpx.x * 2 + this.sizeClnFilter.left)/this.drawZoom,
        drawBase.y + (-this.sizeTpx.y * 2 + this.sizeClnFilter.top)/this.drawZoom + this.getDrawBaseDispClimPx_y()/this.map.zoom,
        this.sizeClnFilter.x / this.map.zoom,
        this.sizeClnFilter.y / this.map.zoom);
}

bckMap.prototype.drawFilterImprovements = function(){
    if (this.map.mode.type == iMap.mode.type.view) return;
    if (this.map.mode.subtype != 'road' && this.map.mode.subtype != 'env') return;

    var img = this.getOrLoadRes('grid', 'imp');

    if(!img) return;

    if (this.map.mode.subtype == 'road'){
        if (!this.map.tileHover || !this.map.tileHover.tile) return;
        var tile = this.map.tileHover.tile;
    } else {
        var tile = this.map.getTile(wofh.town.pos);
    }

    if(!tile) return;
    var drawBase = this.calcDrawBase(tile[Tile.param.posTMpx]);

    this.drawImage(
        this.canvas,
        img,
        0,
        0,
        this.sizeImpFilter.x / this.imgZoom,
        this.sizeImpFilter.y / this.imgZoom,
        drawBase.x + (-this.sizeTpx.x * 1 -25)/this.drawZoom,
        drawBase.y + (-this.sizeTpx.y * 1 -24)/this.drawZoom + this.getDrawBaseDispClimPx_y()/this.map.zoom,
        this.sizeImpFilter.x / this.map.zoom,
        this.sizeImpFilter.y / this.map.zoom);
}

bckMap.prototype.isDepositInRange = function(posTMT){
    return Math.abs(posTMT.x - wofh.town.pos.x)<=Deposit.townDistance &&
            Math.abs(posTMT.y - wofh.town.pos.y)<=Deposit.townDistance;
};

bckMap.prototype.calcCoordDist = function(pointA, pointB){
    if(!pointB) pointB = wofh.town.pos;
    var distX = Math.abs(pointA.x - pointB.x);
    var distY = Math.abs(pointA.y - pointB.y);
    return Math.max(distX, distY);
};

/*тултип*/

bckMap.prototype.getTooltipData = function(){
    //базовые данные, такие же выводим для правой панели
    var data = this.map.prepareTileBaseInfo(this.map.tileHover.tile);

    //дополняем событиями
    data.events = this.getTileEvents(this.map.tileHover.tile);

    return data;
};

bckMap.prototype.showTooltip = function(loadedInfo){
    this.removeTooltip();

    if (!this.map.tileHover || !this.map.tileHover.tile || this.map.clrMapScr) return;

    if (this.map.mode.type == iMap.mode.type.build && this.map.mode.subtype == 'road' && this.map.tileSelect.dir != -1) return;

    var ttData = this.getTooltipData();

    if (
            !ttData.player && 
            !ttData.town && 
            !ttData.deposit && 
            !ttData.improves.length && 
            !ttData.terrain.id && 
            ttData.events.isEmpty() && 
            utils.calcObjSum(ttData.tile[Tile.param.roads]) < 2
        ){
        return;
    }

    //догрузки
    var comments = this.map.tileHover.tile[Tile.param.comment];

    if(comments){
        ttData.comments = comments.slice(0, this.tooltipCommentCount);

        ttData.commentsHidden = comments.length - this.tooltipCommentCount;
    }

    if( Town.hasDefMoment(this.map.tileHover.tile[Tile.param.defmoment]) )
        ttData.town.defmoment = this.map.tileHover.tile[Tile.param.defmoment];

    var cont = tmplMgr.iMap.tooltip(ttData),
        posTWpx = this.calcDrawBase(this.getPosTMpxByPosTMT(this.map.tileHover.posTMT)),
        opt = {
            voiceHelper: {
                text: loadedInfo ? '' : cont, 
                htmlSeparator: ' '
            }
        };

    opt.area = {x: this.sizeVpx.x, y: this.sizeVpx.y};
    
    this.addMapROffset(opt.area);
    
    opt.posSqr = this.calcTooltipPosSqr();

    opt.offset = this.calcTooltipPosOffset();

    var ttTag = this.addTooltipWnd(cont, posTWpx, opt);

    if( !ttTag ) return; 

    ttTag.cont.on('mouseover', this.removeTooltip.bind(this));

    if( !this.isTileInCache(ttData) ){
        // Догрузка недостающей информации
        this.to_tooltip = this.setTimeout(function(){
            this.loadTooltipInfo();
        }, 1000);
    }
};

    bckMap.prototype.addMapROffset = function(area){
        var panelRTag = this.map.getRight().wrp;
        
        if( !panelRTag )
            return;
        
        panelRTag = panelRTag.find('.map_panelR');
        
        area.x -= panelRTag.hasClass('opened') ? panelRTag.outerWidth(true) : 0;
    };

bckMap.prototype.calcTooltipPosSqr = function(){
    var posSqr = {top: 0, bottom: 0};
    posSqr.left = posSqr.right = this.sizeTpx.x / 2;

    return posSqr;
};

bckMap.prototype.calcTooltipPosOffset = function(){
    return {x: 0, y: 0};
};

bckMap.prototype.addTooltipWnd = function(cont, posTWpx, opt){
    return tooltipMgr.show(cont, posTWpx, opt);
};

bckMap.prototype.loadTooltipInfo = function(){
    var self = this;

    if(!this.map.tileHover || this.map.tileHover.extData || !wndMgr.getFirstWndByType(TooltipWnd)) return;

    this.map.loadTileInfo(this.map.tileHover.tile, function(resp){
        if( self.isRemoved() )
            return;

        if(!self.sameTile(self.map.tileHover.posTMT, resp.posTMT)) return;

        self.map.tileHover.extData = true;

        if(self.map.tileHover.tile[Tile.param.comment]){
            self.map.tileHover.comments = self.map.tileHover.tile[Tile.param.comment];
        }

        if(resp.town){
            self.map.tileHover.tile[Tile.param.defmoment] = (resp.town.army||{}).defmoment;
        }

        self.addTileToCache(self.map.tileHover);

        self.showTooltip(true);
    }, true);
};

bckMap.prototype.removeTooltip = function(){
    this.clearTimeout(this.to_tooltip);

    tooltipMgr.hide();
};

bckMap.prototype.isTileInCache = function(tile){
    return this.tileCacheList[tile.posTMT.x+''+tile.posTMT.y];
};

bckMap.prototype.addTileToCache = function(tile){
    this.tileCacheList[tile.posTMT.x+''+tile.posTMT.y] = tile;
};

bckMap.prototype.clearTileCache = function(tile){
    if( tile )
        delete this.tileCacheList[tile.posTMT.x+''+tile.posTMT.y];
    else
        this.tileCacheList = {};
};

bckMap.prototype.checkTileCache = function(){
    this.clearTileCache();

    this.setTimeout(this.checkTileCache, 60000);
};


//******************* //
// ***** ДОРОГИ ***** //
//******************* //

bckMap.prototype.cloneDrawImg = function(drawImg){
    var tile = drawImg.tile;
    delete drawImg.tile;

    var clone = utils.clone(drawImg);

    drawImg.tile = tile;
    clone.tile = tile;

    return clone;
};

bckMap.prototype.calcRiverEnds = function(tile){
    tile[Tile.param.roads] = [];

    var roadType,
        realRoads = [];

    for( var roadDir = 0; roadDir < Tile.dirsMap.length; roadDir++ ){
        roadType = (tile[Tile.param.road]>>(roadDir*3))%8;

        if( roadType == (Road.ids.railway+1) )
            roadType = this.checkTunnelEnds(tile, roadType, roadDir, realRoads);

        tile[Tile.param.roads][(roadDir+2)%8] = roadType;
    }

    tile[Tile.param.roadsExt] = [];

    roadType = (tile[Tile.param.road]>>(roadDir*3))%8;
    // Проверяем пересечение тайла с тоннелем СВЕРХУ (0-е или 2-е)
    if( roadType == (Road.ids.railway+1) )
        roadType = this.checkTunnelEnds(tile, roadType, false, false, {dirs: [0, 2]});

    tile[Tile.param.roadsExt][roadDir] = roadType;

    roadDir++;

    roadType = (tile[Tile.param.road]>>(roadDir*3))%8;
    // Проверяем пересечение тайла с тоннелем СПРАВА (2-е или 4-е)
    if( roadType == (Road.ids.railway+1) )
        roadType = this.checkTunnelEnds(tile, roadType, false, false, {dirs: [2, 4]});

    tile[Tile.param.roadsExt][roadDir] = roadType;

    if( realRoads.length ){
        tile[Tile.param.realRoads] = [];

        for(roadDir in tile[Tile.param.roads]){
            tile[Tile.param.realRoads][roadDir] = realRoads[roadDir]||tile[Tile.param.roads][roadDir];
        }
    }
    
    this.checkRiverEnds(tile);
};

    bckMap.prototype.checkRiverEnds = function(tile){
        var roadDirs = tile[Tile.param.roads];

        var dir = -1;

        for(var pointAi = 0; pointAi < 8; pointAi++){
            if( roadDirs[pointAi] != 1 ) 
                continue;

            if( dir != -1 )
                return;
            else
                dir = pointAi;
        }

        if( dir == -1 ) 
            return;

        if( tile[Tile.param.climate] == 1 )
            this.calcRiverMouth(tile, dir);
        else
            tile[Tile.param.layers].river_end = [{type: 'source'+tile[Tile.param.climate], x: dir, y: 0}];
    };

bckMap.prototype.checkTunnelEnds = function(tile, roadType, roadDir, realRoads, cross){
    var nextTile;

    if( cross ){
        nextTile = this.map.getTileByDir(tile[Tile.param.posTMT], cross.dirs[0]);

        if( nextTile && Tile.isMountains(nextTile) )
            roadType = Road.ids.tunnel+1;
        else{
            nextTile = this.map.getTileByDir(tile[Tile.param.posTMT], cross.dirs[1]);

            if( nextTile && Tile.isMountains(nextTile) )
                roadType = Road.ids.tunnel+1;
        }
    }
    else{
        if( Tile.isMountains(tile) )
            roadType = Road.ids.tunnel+1;
        else{
            nextTile = this.map.getTileByDir(tile[Tile.param.posTMT], (roadDir+2)%8);

            if( nextTile && Tile.isMountains(nextTile) )
                realRoads[(roadDir+2)%8] = Road.ids.tunnel+1;
        }
    }

    return roadType;
};

bckMap.prototype.calcTileRoads = function(tile){
    var roadDirs = tile[Tile.param.roads],
        layer,
        roads;

    Tile.initRoadLayers(tile);

    for(var roadType in Road.ids){
        roadType = Road.ids[roadType];

        roads = [];

        // Расчет тоннелей производится для слоя pike_road, который отрисовывается выше гор
        if( Tile.isMountainRoad(roadType) )
            layer = tile[Tile.param.layers].pike_road;
        else
            layer = tile[Tile.param.layers].road;

        layer.push({type: roadType, roads: roads});

        this.calcTileRoad(tile, roadDirs, roadType, roads);
    }

    this.correctRoadJoints(tile);

    var layers = ['road', 'pike_road'];

    for(var layer in layers){
        layer = tile[Tile.param.layers][layers[layer]];

        for(var i = 0; i < layer.length; i++){
            if( !layer[i].roads.length ){
                layer.splice(i, 1);

                i--;
            }
            else{
                if( debug.useMapRoadsCacheInWorker() ){
                    var res = layer[i];

                    res.posTMT = tile[Tile.param.posTMT];
                    res.posTMpx = tile[Tile.param.posTMpx];
                    res.tile = tile;

                    iMap.roadsCache.push(res);
                }
            }
        }
    }
};

bckMap.prototype.calcTileTunnelArches = function(tile){
    var tunnel_arches = [],
        roadDirs = tile[Tile.param.roads];

    for(var dir in roadDirs){
        if( roadDirs[dir] && roadDirs[dir] != (Road.ids.river+1) ){
            var nextTile = this.map.getTileByDir(tile[Tile.param.posTMT], dir);

            if( nextTile && !Tile.isMountains(nextTile) ){
                var arch = {
                    type: 'tunnel_arches',
                    x: dir, 
                    y: tile[Tile.param.climate] - 2
                };

                arch.addDisp = this.tunnelDisp.arch[dir];

                tunnel_arches.push(arch);
            }
        }
    }

    return tunnel_arches;
};

bckMap.prototype.calcTileRoad = function(tile, roadDirs, roadType, roads){
    for(var pointAi=0; pointAi<8; pointAi++){
        if(roadDirs[pointAi] != roadType+1) continue;

        var pointsBi = this.getOpositeRoadPoints(tile, roadDirs, pointAi, roadType);

        if( roadType==0 && pointsBi==8 )
            continue;

        if(typeof(pointsBi) == 'undefined')
            continue;

        for(var pointBi in pointsBi){
            pointBi = pointsBi[pointBi];

            //учет направления дороги (для рандома)
            var roadI = pointAi < pointBi && pointBi != 8 ? {from:pointAi, to:pointBi} : {from:pointBi, to:pointAi};

            if(roadType != 0 && Tile.tileRiverCount(tile))
                var roadsX = this.calcRiverCross(tile, roadI);
            else
                var roadsX = [{endPoints: roadI}];

            for(var i in roadsX){
                var road = roadsX[i];

                //проверяем, ходили ли уже по этому пути
                var dublicate = false;
                for(var roadTry in roads){
                    var endPoints = roads[roadTry].endPoints;
                    if(endPoints.from == road.endPoints.from && endPoints.to == road.endPoints.to){
                        if(
                            (endPoints.ford && road.endPoints.ford && endPoints.ford.dir == road.endPoints.ford.dir) ||
                            (!endPoints.ford && !road.endPoints.ford)
                        ){
                            dublicate = true;
                            break;
                        }
                    }
                }
                if(dublicate)
                    continue;

                road.dir = pointAi;

                roads.push(road);

                this.calcRoadForTile(tile, road, roadType);
            }
        }
    }
};

    bckMap.prototype.calcRoadForTile = function(tile, road, roadType){
        this.calcRoad(tile, road, roadType);
    };

bckMap.prototype.getTileRoadPoints = function(tile, roadType, currentRoad){
    var points = [];
    
    if( !tile[Tile.param.layers].road )
        return points;
    
    var layer;

    if( Tile.isMountainRoad(roadType) )
        layer = tile[Tile.param.layers].pike_road[roadType];
    else
        layer = tile[Tile.param.layers].road[roadType];
    
    if( layer === undefined )
        return points;
    
    for(var road in layer.roads){
        road = layer.roads[road];

        if( currentRoad && currentRoad.dir == road.dir )
            continue;
        
        for(var point in road.pSgmPx){
            points.push(road.pSgmPx[point]);
        }
    }
    
    return points;
};

bckMap.prototype.getTileBridge = function(tile){
    for(var i in tile[Tile.param.layers].imp0){
        var imp = tile[Tile.param.layers].imp0[i];
        if(imp.type == 'bridge'){
            return imp;
        }
    }

    return false;
};


bckMap.prototype.calcRoad = function(tile, road, roadType, correctJoints){		
    //ищем переправы
    if( road.endPoints.ford !== undefined ){
        var roadPx = {};
        var A_hill = this.getHillByDir(tile, roadType, road.endPoints.from, true);

        roadPx.A = this.getRoadPointTpx(road.endPoints.from, A_hill);
        roadPx.B = this.getFordPointTpx(road.endPoints.ford);

        // Смещаем конечные и ночальные точки отрисовки для тоннеля, если он переходит в ЖД дорогу (переход с горы на другой рельеф)
        if( roadType == Road.ids.tunnel )
            this.addTunnelPointPxDisp(roadPx.A, tile, road.endPoints.from);

        roadPx.C = utils.clone(roadPx.A);
        roadPx.C.x /= 2;
        roadPx.C.y /= 2;

        roadPx.D = this.getRoadPointTpx(road.endPoints.ford.dir, false);
        roadPx.D.x /= 2;
        roadPx.D.y /= 2;

        road.pBeziePx = [roadPx.A, roadPx.C, roadPx.D, roadPx.B];

        this.calcRoadSpline(tile, road, roadType);

        return;
    }

    //нет моста
    var posPTpx_A_hill = this.getHillByDir(tile, roadType, road.endPoints.from, true);
    var posPTpx_A = this.getRoadPointTpx(road.endPoints.from, posPTpx_A_hill);

    var posPTpx_B_hill = this.getHillByDir(tile, roadType, road.endPoints.to, true);	
    var posPTpx_B = this.getRoadPointTpx(road.endPoints.to, posPTpx_B_hill);

    //проверка устья реки
    var riverEnd = tile[Tile.param.layers].river_end;

    if(riverEnd && riverEnd[0] && riverEnd[0].mouth){
        riverEnd = riverEnd[0];

        var mouthPoint = road.endPoints.to == this.invDir(riverEnd.dir) ? posPTpx_B : posPTpx_A;

        var dirDisp = this.riverSpriteDisp[riverEnd.dir];

        mouthPoint.x = riverEnd.addDisp.x + dirDisp.x;
        mouthPoint.y = riverEnd.addDisp.y + dirDisp.y;

        var posPTpx_M = utils.clone(mouthPoint);
        posPTpx_M.x += Tile.dirsScr[riverEnd.dir].x * this.sizeTpx.x/5;
        posPTpx_M.y += Tile.dirsScr[riverEnd.dir].y * this.sizeTpx.y/5;
    }

    // Смещаем конечные и ночальные точки отрисовки для тоннеля, если он переходит в ЖД дорогу (переход с горы на другой рельеф)
    if( roadType == Road.ids.tunnel ){
        this.addTunnelPointPxDisp(posPTpx_A, tile, road.endPoints.from);
        this.addTunnelPointPxDisp(posPTpx_B, tile, road.endPoints.to);
    }

    var points = [];

    if(road.endPoints.from==8){// из-в центр
        var posPTpx_C = utils.clone(posPTpx_B);
        posPTpx_C.x /= 2;
        posPTpx_C.y /= 2;

        //делаем примыкание центральной точки
        if(correctJoints){
            var pointX = this.getClosestPoint(posPTpx_A, this.getTileRoadPoints(tile, roadType), this.sizeTpx.y-1);
            
            if(pointX) posPTpx_A = pointX;
        }

        points.push(posPTpx_A);
        points.push(posPTpx_C);
        points.push(posPTpx_B);
    }else{
        points.push(posPTpx_A);

        var posPTpx_C_hill = this.getHillByDir(tile, roadType, 8);
        var posPTpx_C = this.getRoadPointTpx(8, posPTpx_C_hill);

        if(posPTpx_M && road.endPoints.from == this.invDir(riverEnd.dir)){
            points.push(posPTpx_M);//из устья
        }

        if(posPTpx_A_hill != posPTpx_C_hill){
            var posPTpx_AC = utils.clone(posPTpx_A);
            posPTpx_AC.x /= 2;
            posPTpx_AC.y /= 2;
            points.push(posPTpx_AC);
        }

        points.push(posPTpx_C);

        if(posPTpx_M && road.endPoints.from != this.invDir(riverEnd.dir)){
            points.push(posPTpx_M);//из устья
        }

        if(posPTpx_B_hill != posPTpx_C_hill){
            var posPTpx_BC = utils.clone(posPTpx_B);
            posPTpx_BC.x /= 2;
            posPTpx_BC.y /= 2;

            points.push(posPTpx_BC);
        }

        points.push(posPTpx_B);
    }

    //road.pBeziePx = [posPTpx_A, posPTpx_C, posPTpx_B];
    road.pBeziePx = points;
    
    this.calcRoadSpline(tile, road, roadType);
};

bckMap.prototype.calcRoadSpline = function(tile, road, roadType){
    var roadInfo = this.roadData[roadType];

    var iter = roadInfo.iter;
    //расчёт итераций,если надо
    if(roadInfo.calcIter){
        var length = 0;
        for(var i=0; i<road.pBeziePx.length-1; i++){
            length += Trade.calcDistance(road.pBeziePx[i], road.pBeziePx[i+1]);
        }
        iter = wofh.iteeer||Math.round(iter * length/this.sizeTpx.x);
    }

    var disp = 1/iter;

    if( roadInfo.rand )
        invwk.setSeed(tile[Tile.param.posTMT].x*tile[Tile.param.posTMT].y);
    
    road.pSgmPx = [];
    for(var i = 0; i <= iter; i++){
        var t = i * disp,
            pointX = this.getPointBesie(road.pBeziePx, t);
        
        if( roadInfo.rand && i != iter && i!=0 ){
            // Ищем ближайшую отрисованную точку для другой дороги того же типа
            var pointY = this.getClosestPoint(pointX, this.getTileRoadPoints(tile, roadType, road), roadInfo.rand);

            if( pointY )
                pointX = pointY;
            else{
                //шатаем точку
                pointX.x += utils.toInt((invwk.rand() - 0.5)*roadInfo.rand);
                pointX.y += utils.toInt((invwk.rand() - 0.5)*roadInfo.rand);
            }
        }

        /*road.segments.push({A:prevPoint, B:pointX, angle:this.getAngle(prevPoint, pointX)})*/
        road.pSgmPx.push(pointX);
    }

    //расчёт углов
    for(var i = 1; i<road.pSgmPx.length-1; i++){
        var X = road.pSgmPx[i];
        X.a = this.getAngle(
            road.pSgmPx[i-1], 
            road.pSgmPx[i+1],
            true);
    }
    road.pSgmPx[0].a = this.getAngle(
            road.pBeziePx[0], 
            road.pBeziePx[1],
            true);
    road.pSgmPx[road.pSgmPx.length-1].a = this.getAngle(
            road.pBeziePx[road.pBeziePx.length-2], 
            road.pBeziePx[road.pBeziePx.length-1],
            true);

    //расчёт этапов прорисовки дороги
    road.stepData = {};

    for(var step in roadInfo.draw){
        step = roadInfo.draw[step];

        road.stepData[step.img] = {};

        switch(step.type){
            case 'line':
                //this.drawRoadSpline(segment, roadType, step, dispPx);
                break;
            case 'area':
                //this.drawRoadArea(segment, roadType, step, dispPx);
                break;
            case 'area-segm':
                this.calcRoadAreaSpline(road, step);
        }

        // Расчитываем маску (обычная дорога с изгибами) по направлению тоннеля
        if( roadType == Road.ids.tunnel && step.type == 'area' )
            this.calcRoadAreaSpline(road, step);
    }
};

bckMap.prototype.calcMiddlePoints = function(tile, spline, roadInfo, pointA, pointB, i){
    var controlA = 0.2;

    if(Math.abs(this.calcDivAngle(pointA.Va,pointB.Va))<=controlA)return false;//малый угол между точками - нужно добавить проверку на минимальное расстояние

    var pointC = this.getPointBesie(spline, (pointB.t + pointA.t)/2);

    var pointAC = this.calcMiddlePoints(tile, spline, roadInfo, pointA, pointC, i+1);
    var pointCB = this.calcMiddlePoints(tile, spline, roadInfo, pointC, pointB, i+1);

    var points = [];
    if(pointAC)points = points.concat(pointAC);
    points = points.concat(pointC);
    if(pointCB)points = points.concat(pointCB);

    return points;
}

bckMap.prototype.addTunnelPointPxDisp = function(pointTpx, tile, dir){
    var tunnelDispPTpx = this.getTunnelRoadDisp(tile, dir);

    if(  tunnelDispPTpx ){
        pointTpx.x +=  tunnelDispPTpx.x;
        pointTpx.y +=  tunnelDispPTpx.y;
    }
};

bckMap.prototype.getTunnelRoadDisp = function(tile, dir){
    if( dir == 8 )
        return false;

    var nextTile = this.map.getTileByDir(tile[Tile.param.posTMT], dir);

    if( nextTile && !Tile.isMountains(nextTile) ){
        return this.tunnelDisp.road[dir];
    }

    return false;
};


bckMap.prototype.drawRoad = function(canvas, imgLayer, road, roadType, step, dispPx){
    step = this.roadData[roadType].draw[step];

    if( this.drawRoadCache ){
        canvas = this.canvasRoad;

        var oldZoom = {
            zoomPicLevel: this.zoomPicLevel,
            drawZoom: this.drawZoom,
            zoom: this.map.zoom,
            sizeTpx: this.sizeTpx
        };

        this.zoomPicLevel = 0;
        this.drawZoom = 1;
        this.map.zoom = 1;

        this.sizeTpx = Tile.sizePxArr[this.zoomPicLevel];

        var cacheDispPx = dispPx;
        dispPx = {x: this.canvasRoad.offset.x, y: this.canvasRoad.offset.y};
    }
    else if( step ){
        if( step.show == 'noZoom' && this.zoomPicLevel == 1 )
            return;
    }

    switch(step.type){
        case 'line':
            this.drawRoadSpline(canvas, imgLayer, road, roadType, step, dispPx, cacheDispPx);
            break;
        case 'area':
            this.drawRoadArea(canvas, imgLayer, road, roadType, step, dispPx, cacheDispPx);
            break;
        case 'area-segm':
            this.drawRoadAreaSpline(canvas, imgLayer, road, roadType, step, dispPx, cacheDispPx);
    }

    if( this.drawRoadCache ){
        this.zoomPicLevel = oldZoom.zoomPicLevel;
        this.drawZoom = oldZoom.drawZoom;
        this.map.zoom = oldZoom.zoom;
        this.sizeTpx = oldZoom.sizeTpx;
    }
};

bckMap.prototype.drawRoadSpline = function(canvas, imgLayer, roadSegm, roadType, step, dispPx){
    var img = this.getOrLoadRes(imgLayer, roadType)[step.img];

    if (!img || (!this.patterns[this.zoomPicLevel][imgLayer] || !this.patterns[this.zoomPicLevel][imgLayer][roadType]) ) 
        return;
    
    var A, B, translateX, translateY, angle,
        translateZoomX = dispPx.x + this.sizeTpx.x / this.drawZoom * 0.5,
        translateZoomY = dispPx.y + this.sizeTpx.y / this.drawZoom * 0.5,
        dispClimPx_y = this.dispClimPx_y + (step.y ? step.y : 0),
        imgY1 = -img.height / this.drawZoom * 0.5,
        imgY2 = img.height / this.drawZoom,
        oldFillStyle = canvas.fillStyle,
        pSgmLength = roadSegm.pSgmPx.length-1;

    canvas.fillStyle = this.patterns[this.zoomPicLevel][imgLayer][roadType][step.img];

    for(var i = 0; i < pSgmLength; i++){
        A = roadSegm.pSgmPx[i];
        B = roadSegm.pSgmPx[i+1];

        translateX = A.x / this.map.zoom + translateZoomX;
        translateY = (A.y + dispClimPx_y) / this.map.zoom + translateZoomY;

        angle = Math.PI - this.getAngle(B, A);

        canvas.translate(translateX, translateY);

        canvas.rotate(angle);

        // Конструкция с beginPath --> rect --> fill --> closePath в хроме работает гораздо быстрее с паттернами (с обычными цветами всё норм) чем fillRect
        //canvas.fillRect(0, imgY1, Trade.calcDistance(B, A) / this.map.zoom, imgY2);

        canvas.beginPath();

        canvas.rect(0, imgY1, Trade.calcDistance(B, A) / this.map.zoom, imgY2);

        canvas.fill();

        canvas.closePath();

        canvas.rotate(-angle);

        canvas.translate(-translateX, -translateY);
    }

    canvas.fillStyle = oldFillStyle;
};

bckMap.prototype.drawRoadArea = function(canvas, imgLayer, roadSegm, roadType, step, dispPx, cacheDispPx){		
    var img = this.getOrLoadRes(imgLayer, roadType)[step.img];

    if ( !img || (!this.patterns[this.zoomPicLevel][imgLayer] || !this.patterns[this.zoomPicLevel][imgLayer][roadType]) ) return;
    
    if( roadType == Road.ids.tunnel ){
        var canvasOrign = canvas;

        canvas = this.canvasMask;

        if( cacheDispPx ){
            var tmpDispPx = dispPx;

            dispPx = cacheDispPx;

            cacheDispPx = tmpDispPx;
        }


        this.prepareTunnelMask(canvas, imgLayer, roadSegm, roadType, step, dispPx);
    };

    canvas.save();

    canvas.fillStyle = this.patterns[this.zoomPicLevel][imgLayer][roadType][step.img];

    canvas.translate(
        dispPx.x + this.sizeTpx.x / this.drawZoom * 0.5, 
        dispPx.y + this.dispClimPx_y / this.map.zoom + this.sizeTpx.y / this.drawZoom * 0.5);

    var sgmL = roadSegm.pBeziePx.length;

    canvas.beginPath();

    canvas.moveTo(
        roadSegm.pBeziePx[0].x/this.map.zoom,						roadSegm.pBeziePx[0].y/this.map.zoom);

    if( sgmL==3 ){
        canvas.bezierCurveTo(
            roadSegm.pBeziePx[0].x/this.map.zoom,					roadSegm.pBeziePx[0].y/this.map.zoom, 
            roadSegm.pBeziePx[1].x/this.map.zoom,					roadSegm.pBeziePx[1].y/this.map.zoom, 
            roadSegm.pBeziePx[2].x/this.map.zoom,					roadSegm.pBeziePx[2].y/this.map.zoom);
    }
    else{
        canvas.bezierCurveTo(
            roadSegm.pBeziePx[1].x/this.map.zoom,					roadSegm.pBeziePx[1].y/this.map.zoom, 
            roadSegm.pBeziePx[2].x/this.map.zoom,					roadSegm.pBeziePx[2].y/this.map.zoom, 
            roadSegm.pBeziePx[3].x/this.map.zoom,					roadSegm.pBeziePx[3].y/this.map.zoom);
    }

    canvas.lineTo(
        this.getBezieDisp(roadSegm.pBeziePx[sgmL-1], 'x', step),	this.getBezieDisp(roadSegm.pBeziePx[sgmL-1], 'y', step));
    canvas.bezierCurveTo(
        this.getBezieDisp(roadSegm.pBeziePx[2], 'x', step),			this.getBezieDisp(roadSegm.pBeziePx[2], 'y', step), 
        this.getBezieDisp(roadSegm.pBeziePx[1], 'x', step),			this.getBezieDisp(roadSegm.pBeziePx[1], 'y', step), 
        this.getBezieDisp(roadSegm.pBeziePx[0], 'x', step),			this.getBezieDisp(roadSegm.pBeziePx[0], 'y', step));

    canvas.closePath();

    canvas.fill();

    canvas.restore();

    if( roadType == Road.ids.tunnel ){
        if( cacheDispPx )
            // Вытаскиваем из маски кусок для кеша
            canvasOrign.drawImage(
                this.canvasMaskTag, 
                dispPx.x - cacheDispPx.x, 
                dispPx.y - cacheDispPx.y,
                canvasOrign.canvas.width,
                canvasOrign.canvas.height,
                0,
                0,
                canvasOrign.canvas.width,
                canvasOrign.canvas.height
            );
        else
            canvasOrign.drawImage(this.canvasMaskTag, 0, 0);

        canvas.globalCompositeOperation = 'source-over';
    }
};

bckMap.prototype.prepareTunnelMask = function(canvas, imgLayer, roadSegm, roadType, step, dispPx){
    this.clearView(canvas);

    canvas.translate(0, 6);

    this.drawRoadAreaSpline(canvas, imgLayer, roadSegm, roadType, step, dispPx);

    canvas.globalCompositeOperation = 'destination-in';

    canvas.drawImage(this.canvasMountMaskTag, 0, -6);

    canvas.translate(0, -6);

    canvas.globalCompositeOperation = 'source-out';
};

bckMap.prototype.getBezieDisp = function(point, xy, step){
    return (point[xy] + (point.h && step.h? step.h: step)[xy])/this.map.zoom;
};

bckMap.prototype.calcRoadAreaSpline = function(roadSegm, step){
    if(step.rand)
        invwk.setSeed(step.rand);

    var persp = step.view=='perspective'?2:1;

    if( step.rand_smooth )
        var smoothDisp = step.rand - 1 / step.w;

    // почему то у дорог горизонтальные и вертикальные участки дорог были шире при отрисовке
    if(roadSegm.endPoints.to%2==1 && (roadSegm.endPoints.from==8 || roadSegm.endPoints.to - roadSegm.endPoints.from == 4))
        var rk = -0.2;
    else
        var rk = 0;

    var spline1 = [];
    for(var i = 0; i<roadSegm.pSgmPx.length; i++){
        var segment = roadSegm.pSgmPx[i];
        var stepR = segment.h * (step.rh+rk) + (1 - segment.h) * (step.r+rk);
        var X = this.getPointByRA(segment, stepR, segment.a - Math.PI/2, persp);

        if(step.rand && i!=0 && i!=roadSegm.pSgmPx.length-1)
            if(step.rand_smooth){
                spline1.push({
                    x: Math.round((X.x + invwk.rand()*step.rand/step.rand_smooth + smoothDisp)),
                    y: Math.round((X.y + (invwk.rand()*step.rand/step.rand_smooth + smoothDisp) / persp))});
            }else{
                spline1.push({
                    x: Math.round((X.x + invwk.rand()*step.rand)), 
                    y: Math.round((X.y + invwk.rand()*step.rand/persp))});
            }
        else
            spline1.push({x:X.x, y:X.y});
    }
    this.addControlPointsToBesie(spline1, 0.5, roadSegm.pBeziePx[1], roadSegm.pBeziePx[roadSegm.pBeziePx-2]);

    var spline2 = [];
    for(var i = roadSegm.pSgmPx.length-1; i>=0; i--){
        var segment = roadSegm.pSgmPx[i];
        var stepR = segment.h * (step.rh+rk) + (1 - segment.h) * (step.r+rk);
        var X = this.getPointByRA(segment, stepR, segment.a + Math.PI/2, persp);

        if(step.rand && i!=0 && i!=roadSegm.pSgmPx.length-1)
            if(step.rand_smooth){
                spline2.push({
                    x: Math.round((X.x + invwk.rand()*step.rand/step.rand_smooth + smoothDisp)), 
                    y: Math.round((X.y + (invwk.rand()*step.rand/step.rand_smooth + smoothDisp) / persp))});
            }else{
                spline2.push({
                    x: Math.round((X.x + invwk.rand()*step.rand)), 
                    y: Math.round((X.y + invwk.rand()*step.rand/persp))});
            }
        else
            spline2.push({x:X.x, y:X.y});
    }
    this.addControlPointsToBesie(spline2, 0.5, roadSegm.pBeziePx[roadSegm.pBeziePx-2], roadSegm.pBeziePx[1]);

    //укороченные линии для зумленного состояния карты
    var spline1Short = [spline1[0], spline1[Math.floor(spline1.length/2)], spline1[spline1.length-1]];
    var spline2Short = [spline2[0], spline2[Math.floor(spline1.length/2)], spline2[spline1.length-1]];

    var stepData = {
        spline1: spline1,
        spline2: spline2,
        spline1Short: spline1Short,
        spline2Short: spline2Short
    };

    roadSegm.stepData[step.img] = stepData;
};


bckMap.prototype.drawRoadAreaSpline = function(canvas, imgLayer, roadSegm, roadType, step, dispPx){
    var img = this.getOrLoadRes(imgLayer, roadType)[step.img];

    if ( !img || (!this.patterns[this.zoomPicLevel][imgLayer] || !this.patterns[this.zoomPicLevel][imgLayer][roadType]) ) return;
    
    if( step.rand )
        invwk.setSeed(step.rand);

    canvas.save();
    
    if( step.comp )
        canvas.globalCompositeOperation = step.comp;

    canvas.fillStyle = this.patterns[this.zoomPicLevel][imgLayer][roadType][step.img];

    canvas.translate(
        dispPx.x + this.sizeTpx.x / this.drawZoom * 0.5, 
        dispPx.y + (this.dispClimPx_y + (step.y ? step.y : 0)) / this.map.zoom + this.sizeTpx.y / this.drawZoom  * 0.5);

    //получаем точки в области
    var stepData = roadSegm.stepData[step.img];

    if( this.zoomPicLevel == 0 ){//если зум, то показываем только три точки
        var spline1 = stepData.spline1;
        var spline2 = stepData.spline2;
    }
    else{
        var spline1 = stepData.spline1Short;
        var spline2 = stepData.spline2Short;
    }
    
    this.drawSplinePath(canvas, spline1, spline2);

    canvas.restore();
};

    bckMap.prototype.drawSplinePath = function(canvas, spline1, spline2){
        canvas.beginPath();

        canvas.moveTo(spline1[0].x / this.map.zoom, spline1[0].y / this.map.zoom);
        this.drawSpline(canvas, spline1);

        canvas.lineTo(spline2[0].x / this.map.zoom, spline2[0].y / this.map.zoom);
        this.drawSpline(canvas, spline2);

        canvas.fill();
    };
    
        bckMap.prototype.drawSpline = function(canvas, points){
            if( points.length == 2 ){
                canvas.lineTo(points[1].x / this.map.zoom, points[1].y / this.map.zoom);

                return;
            }

            for(var i = 0; i < points.length-1; i++){
                var A = points[i],
                    B = points[i+1],
                    Ac = A.C1,
                    Bc = B.C0;

                if( !Ac ){
                    if( !Bc )
                        return;

                    canvas.quadraticCurveTo(Bc.x / this.map.zoom, Bc.y / this.map.zoom, B.x / this.map.zoom, B.y / this.map.zoom);
                }
                else if( !Bc )
                    canvas.quadraticCurveTo(Ac.x / this.map.zoom, Ac.y / this.map.zoom, B.x / this.map.zoom, B.y / this.map.zoom);
                else
                    canvas.bezierCurveTo(Ac.x / this.map.zoom, Ac.y / this.map.zoom, Bc.x / this.map.zoom, Bc.y / this.map.zoom, B.x / this.map.zoom, B.y / this.map.zoom);
            }
        };

bckMap.prototype.getPointByRA = function(O, R, ang, perspK){
    var A = {};
    A.x = O.x + Math.cos(ang) * R;
    A.y = O.y - Math.sin(ang) * R / perspK; //y смотрит вниз
    /*if(ang == 0){//сопиксельная поправка
        A.x -= 1;
    }*/
    return A;
};

//ищем точки дороги напротив заданной
bckMap.prototype.getOpositeRoadPoints = function(tile, roads, pointAi, roadType){
    //если на тайле есть цивилизованные объекты - города и захваченные местороды, то дороги стягиваем к ним
    if( Tile.getPlayerId(tile) && roadType!=0 )
        return [8];

    //если реки обрываются в море, то они не связаны
    if( roadType == 0 && tile[Tile.param.climate] == 1 ) 
        return [8];

    /*if(this.tileHasRiver(tile)){
        var riverCross = this.calcRiverCross(tile, road);
    }*/

    var pointBi = pointAi+4;//противоположная точка
    var points = [];
    for(var i=0; i<4; i++){
        var pointCi = (pointBi + i)%8;
        if(roads[pointCi] == roadType+1){
            //if(pointCi>pointAi)return;
            points.push(pointCi);
        }
        var pointCi = (pointBi - i)%8;
        if(roads[pointCi] == roadType+1 && i!=0){
            //if(pointCi>pointAi)return;
            if(roadType!=0 || !points.length){//делаем реку без дополнительных развязок-треугольных островов
                points.push(pointCi);
            }
        }

        if(points.length)return points;

    }
    return [8];
};

bckMap.prototype.getHillByDir = function(tile, roadType, dir, checkTunnel){
    if( roadType == Road.ids.river || roadType == Road.ids.tunnel ) return false;

    if(!tile[Tile.param.heightMap]) return false;

    var hill = tile[Tile.param.heightMap][(dir+1)%9] == 1;

    // Если дорога переходит в гору/с горы, смещение холмов не учитываем
    if( 
        hill && 
        checkTunnel && 
        roadType == Road.ids.railway && 
        dir != 8 && 
        Tile.isMountains(this.map.getTileByDir(tile[Tile.param.posTMT], dir)) 
    ){
        hill = false;
    }

    return hill;
};

bckMap.prototype.getRoadPointTpx = function(dir, hill){
    //смещения
    var dispAi = Tile.dirsScr[dir];

    var addHeight = hill ? this.hillHeight : 0;

    //координаты
    return {
        x: dispAi.x * Tile.dispPxArr[0].x, 
        y: (dispAi.y * Tile.dispPxArr[0].y - addHeight),
        h: hill};
};

bckMap.prototype.getFordPointTpx = function(ford){
    //смещения
    var dispAi = Tile.dirsScr[ford.dir];
    //координаты
    return {
        x: dispAi.x * this.bridge.dispDir.x + ford.disp.x * this.bridge.dispRiver.x, 
        y: dispAi.y * this.bridge.dispDir.y + ford.disp.y * this.bridge.dispRiver.y,
        h: false};
};

bckMap.prototype.correctRoadJoints = function(tile){
    var layers = tile[Tile.param.layers],
        layer;

    for(var roadType in Road.ids){
        roadType = Road.ids[roadType];

        if( roadType == Road.ids.tunnel )
            layer = layers.pike_road[roadType];
        else
            layer = layers.road[roadType];

        if(typeof(layer)=='undefined')
            continue;

        for(var road in layer.roads){
            road = layer.roads[road];

            if(road.endPoints.from == 8){
                this.calcRoad(tile, road, roadType, true);
            }
        }
    }
};


//находим, пересекает ли дорога речку
bckMap.prototype.calcRiverCross = function(tile, road){
    if(road.from == 8){
        return [{endPoints:{from: road.to, ford: this.calcRiverFord(tile,road.to)}}];//дорога упирается в реку
    }

    //ищем мост
    var bridge = this.getTileBridge(tile);
    if(bridge){
        return [
            {endPoints:{from: road.to, ford: this.calcRiverFord(tile,road.to)}}, 
            {endPoints:{from: road.from, ford: this.calcRiverFord(tile,road.from)}}];//ВСЕ дороги всегда стягиваются к мосту
    }

    //нужна ли переправа
    var lastRoad = false;
    var roads = tile[Tile.param.roads];
    for(var i=0; i<2; i++){//2 прохода по циклу
        for(var dir in roads){
            if(roads[dir]==1){//вода
                lastRoad = false;
            }else if(road.from==dir || road.to==dir){
                if(lastRoad)
                    return [{endPoints:road}];//дорога НЕ пересекает реку

                lastRoad = true;
            }
        }
    }

    return [
        {endPoints:{from: road.to, ford: this.calcRiverFord(tile,road.to)}}, 
        {endPoints:{from: road.from, ford: this.calcRiverFord(tile,road.from)}}];//дорога пересекает реку
};

//вычиcление направления переправы и смещения
bckMap.prototype.calcRiverFord = function(tile, pointAi){
    var roads = tile[Tile.param.roads];
    var find = false;
    for(var i=0; i<=1; i++){//2 прохода по циклу
        for(var dir in roads){
            if(roads[dir]==1){
                if(!find){
                    var start = +dir+i*8;
                }
                if(find && typeof(start)!='undefined'){
                    var finish = +dir+i*8;
                    break;
                }
            }
            if(dir == pointAi && typeof(start)!='undefined'){
                find = true;
            }
        }

        if( finish !== undefined )
            break;
    }

    //нужно учитывать дороги, а не точки
    var dir = ((start+finish)/2)%8;
    if(dir%1 != 0) dir = Math.floor(dir/2)*2+1;

    var disp = this.calcFordDisp(start, finish);

    return {dir: dir, disp: disp};
};

bckMap.prototype.calcFordDisp = function(from, to){
    return{
        x: Tile.dirsScr[from].x + Tile.dirsScr[to%8].x,
        y: Tile.dirsScr[from].y + Tile.dirsScr[to%8].y};
};

bckMap.prototype.calcRiverEnvData = function(tile){
    var bridgeData = {};
    
    bridgeData.tile = tile;

    //определяем направление реки
    var from, to;
    var roads = tile[Tile.param.roads];
    for(var dir in roads){
        if(roads[dir]==1){//вода
            if(typeof(from)=='undefined'){
                from = +dir;
            }else{
                to = +dir;
                break;
            }
        }
    }

    if((from%4 == 1 && to%4 == 3) || (from%4 == 3 && to%4 == 1)){//река меняет направления с гор на верт
        var dir = (from + to == 8)? 2: 3;
    }else if(from == 0 && to==4){//река по главной диагонали
        var dir = 3;
    }else if(from == 2 && to==6){//река по главной диагонали
        var dir = 2;
    }else{
        var dir = (from%4 == 3 || to%4 == 3)? 0: 1;
    }

    bridgeData.dir = dir;
    
    bridgeData.dispTpx = this.calcBridgeDispTpx(from, to);

    return bridgeData;
};

    bckMap.prototype.calcBridgeDispTpx = function(from, to){
        var dispTi = this.calcFordDisp(from, to);
        
        //координаты
        var dispTpx = {
            x: 0, 
            y: -Tile.sizePxArr[0].y + this.dispClimPx_y
        };
        dispTpx.x += dispTi.x * this.bridge.dispRiver.x;
        dispTpx.y += dispTi.y * this.bridge.dispRiver.y;

        return dispTpx;
    };

bckMap.prototype.calcWaterMill = function(tile){
    var impId = 5;
    var bridgeData = this.calcRiverEnvData(tile);
    var level = Tile.getTileImpLevel(tile, impId)||1;
    bridgeData.type = 'env'+impId+'_'+level;
    bridgeData.info = {mapimp: impId};
    bridgeData.maxRoad = 0;


    return bridgeData;
};

bckMap.prototype.calcBridge = function(tile, defLevel){
    var impId = 0,
        bridgeData = this.calcRiverEnvData(tile),
        level = Tile.getTileImpLevel(tile, impId)||defLevel;

    bridgeData.maxRoad = level-1;

    if( level == 3 ){
        var roads = tile[Tile.param.roads];
        //ищем максимальную реку
        var maxRoad = 0;

        for(var dir in roads){
            if(roads[dir]-2 > maxRoad){
                maxRoad = roads[dir]-2;
            }
        }

        bridgeData.maxRoad = Math.max(bridgeData.maxRoad, maxRoad);
    }

    bridgeData.type = 'env'+impId+'_1';

    bridgeData.info = {mapimp: impId};

    return bridgeData;
};

bckMap.prototype.drawBridge = function(canvas, bridgeData, drawBase, img){

    //отрисовка
    var tile = {x: bridgeData.dir, y: bridgeData.maxRoad};

    this.drawImage(
        canvas,
        img,
        tile.x * this.tileWide.sizePx.x,
        tile.y * this.tileWide.sizePx.y,
        this.tileWide.sizePx.x,
        this.tileWide.sizePx.y,
        drawBase.x + bridgeData.dispTpx.x/this.map.zoom,
        drawBase.y + bridgeData.dispTpx.y/this.map.zoom,
        this.tileWide.sizePx.x/this.drawZoom,
        this.tileWide.sizePx.y/this.drawZoom);
};



bckMap.prototype.calcRiverMouth = function(tile, dir){
    var pTile = this.map.getTileByDir(tile[Tile.param.posTMT], dir); 

    if( !pTile ) 
        return;

    var climRel = this.getClimRel(tile[Tile.param.clim_new], 0),
        pTile_climRel = this.getClimRel(pTile[Tile.param.clim_new], 1),
        selRel,
        selTile;

    switch(dir){
        case 1:
            selRel = climRel.norm[0] ? climRel : pTile_climRel;
            selTile = climRel.norm[0] ? tile : pTile;

            break;
        case 0:
        case 2:
            selRel = climRel;
            selTile = tile;

            break;
        case 3:
        case 7:
            var bTile = this.map.getTileByDir(tile[Tile.param.posTMT], 5+(dir<5?-1:1));

            if( !bTile ) return;

            selRel = this.getClimRel(bTile[Tile.param.clim_new], bTile[Tile.param.climate] == Tile.climateIds.water ? 0 : 1);
            selTile = bTile;

            break;
        case 4:
        case 6:
            selRel = pTile_climRel;
            selTile = pTile;

            break;
        case 5:
            selRel = pTile_climRel.norm[0] ? climRel : pTile_climRel;
            selTile = pTile_climRel.norm[0] ? tile : pTile;
    }

    if( this.riverMouthDisp[dir][selRel.i] ){
        if( pTile[Tile.param.climate]-2 < 0 ) 
            return;

        var climate = Math.max(0, pTile[Tile.param.climate]-2),
            disp = this.riverMouthDisp[dir][selRel.i][climate],
            subDir = disp.s;
    }

    selTile[Tile.param.layers].river_end = [];

    if( !disp )
        disp = {x: 0, y: 0};

    pTile[Tile.param.layers].river_end = [{type: 'mouth'+pTile[Tile.param.climate]+dir, x: subDir||0, y: 0, addDisp: disp, dir: dir, mouth: true}];
};

bckMap.prototype.invDir = function(dir){
    return (dir+4)%8;
};

bckMap.prototype.calcDrawBase = function(posTMpx, center){
    if( !this.posMWpx_draw )
        return false;

    var drawBase = {
        x: (posTMpx.x + this.posMWpx_draw.x)/this.map.zoom,
        y: (posTMpx.y + this.posMWpx_draw.y)/this.map.zoom
    };

    if ( center )
        this.centerDrawBase(drawBase);

    return drawBase;
};

bckMap.prototype.centerDrawBase = function(drawBase){
    drawBase.x += Tile.dispPxArr[0].x / this.map.zoom;
    drawBase.y += (Tile.dispPxArr[0].y + this.getDrawBaseDispClimPx_y()) / this.map.zoom;
};

bckMap.prototype.calcConstructNewRoads = function(){
    if( !this.map.tileSelect ) return;

    var tile = this.map.tileSelect.tile;

    if(!this.canBuildRoadInTile(tile)) return;

    var roadDirs = utils.clone(tile[Tile.param.roads]),
        realRoadDirs = [];

    this.map.tileSelect.roadDirs = roadDirs;

    this.map.tileSelect.maxRoad = 1;

    for(var dir in Tile.dirsMap){
        dir = +dir;

        //проверки
        var roadType = roadDirs[dir];

        roadDirs[dir] = realRoadDirs[dir] = 0;

        if(roadType == 1)
            continue;

        var nextTile = this.map.getTileByDir(tile[Tile.param.posTMT], dir);

        if( !nextTile )
            continue;

        var checkTunnelAbil = false,
            realRoadType = 0;

        // Дорога с/на гороу может - это тоннель но отрисовывается, как ЖД;
        // Дорога по горое - это тоннель
        // Если дороги небыло, строится тоннель минуя грунтовку и шоссе
        if( Tile.isMountains(tile) || Tile.isMountains(nextTile) ){
            if( roadType == 0 ){
                realRoadType = Road.ids.tunnel;

                if( Tile.isMountains(tile) )
                    roadType = Road.ids.tunnel;
                else
                    roadType = Road.ids.railway;

                checkTunnelAbil = true;
            }
            else
                continue;
        }
        else if( roadType == 0 )
            roadType = Road.ids.dirt;

        if( Tile.isNotResearchedRoad(roadType, checkTunnelAbil) )
            continue;

        if( !this.canBuildRoadInTile(nextTile, tile) )
            continue;

        if( Tile.dirsMap[dir].x && Tile.dirsMap[dir].y ){
            var prevRivTile = this.map.getTileByDir(tile[Tile.param.posTMT], (dir-1)%8);

            if(Tile.tileRiverCount(prevRivTile)>=1 && prevRivTile[Tile.param.roads][(dir+2)%8] == 1)
                continue;
        }

        roadDirs[dir] = roadType;

        if( realRoadType ){
            var hasRealRoadType = true;

            realRoadDirs[dir] = realRoadType;
        }
        else
            realRoadDirs[dir] = roadType;

        this.map.tileSelect.maxRoad = Math.max(roadType, this.map.tileSelect.maxRoad);
    }

    if( hasRealRoadType )
        this.map.tileSelect.realRoadDirs = realRoadDirs;
};

bckMap.prototype.cloneTile = function(tile){
    var layers = tile[Tile.param.layers];

    delete tile[Tile.param.layers];

    var clone = utils.clone(tile);
    tile[Tile.param.layers] = layers;
    clone[Tile.param.layers] = layers;
    return clone;
};



bckMap.prototype.setZoom = function(delta){
    // Корректировка положения камеры
    this.posMWpx.x = this.posMWpx.x - this.sizeVpx.x * 0.5 * delta;
    this.posMWpx.y = this.posMWpx.y - this.sizeVpx.y * 0.5 * delta;

    var zoomPicLevel = this.zoomPicLevel;

    this.zoomPicLevel = this.getZoomPicLevel();

    this.calcZoomParams();

    if( this.zoomPicLevel != zoomPicLevel )
        this.runShow(); // Если изменяется размер отображаемых картинок, перересовываем карту полностью
    else
        this.showView();
};
    
    bckMap.prototype.calcZoomParams = function(){
        this.imgZoom = this.zoomPicLevel + 1;
        
        this.sizeTpx = Tile.sizePxArr[this.zoomPicLevel];

        this.tileWide = this.tileWideArr[this.zoomPicLevel];

        this.tileExtraWide = this.tileExtraWideArr[this.zoomPicLevel];

        this.map.dispTTpx = Tile.dispPxArr[this.zoomPicLevel];

        this.drawZoom = this.map.zoom / this.imgZoom;

        this.zoomFlag = this.flag.sizeDrawPx.y / Math.max(this.flag.sizeDrawPx.y / this.map.zoom, this.flag.hMin);
    };
    
    bckMap.prototype.getZoomPicLevel = function(){
        return this.map.zoom >= 2 ? 1 : 0;
    };
    

bckMap.prototype.canBuildRoadInTile = function(tile, startTile){
    if( !tile ) return false;
    if( Tile.isWater(tile) ) return false;

    if( Tile.isMountains(tile) ){
        if( !this.canBuildRoadInMountain(tile, startTile) )
            return false;
    }

    if( !startTile && Trade.calcMapDistance(wofh.town.pos, tile[Tile.param.posTMT]) > lib.map.makeroaddistance ) 
        return false;//расстояние

    return true;
};

bckMap.prototype.canBuildRoadInMountain = function(tile, startTile){
    // Проверям возможность прокладки тоннеля для конкретного ГОРНОГО тайла (в определенном направлении)
    if( startTile ){
        if( Tile.isMountains(startTile) )
            return  Tile.hasRoad(startTile) || Tile.hasRoad(tile); // Если строим с горы на гору, то хотя бы у одного тайла должен быть тоннель
        else
            return !Tile.isWater(startTile);
    }

    // Проверям возможность прокладки тоннеля в любом направлении 
    // Ищем в окрестности хотя бы один негорный примыкающий тайл или горный тайл с тоннелем
    for (var dir in Tile.dirsScr) {
        var nextTile = this.map.getTileByDir(tile[Tile.param.posTMT], dir);

        if( nextTile ){
            if( !(Tile.isWater(nextTile) || Tile.isMountains(nextTile)) || (Tile.isMountains(nextTile) && Tile.hasRoad(nextTile)) )
                return true;
        }
    }

    return false;
};

bckMap.prototype.calcTileLineCoorPx = function(fromTile, toTile, mult){
    mult = mult||1;

    var pointFromTMT = fromTile.posTMT,
        pointToTMT = toTile.posTMT,
        pointFromPx = this.calcDrawBase(fromTile.tile ? fromTile.tile[Tile.param.posTMpx] : this.getPosTMpxByPosTMT(pointFromTMT, true), true);

    var vectorToTMT = {
        x: (pointFromTMT.x - pointToTMT.x)/ this.map.zoom,
        y: (pointFromTMT.y - pointToTMT.y)/ this.map.zoom
    };
    var pointToPx = this.getPosTMpxByPosTMT(vectorToTMT);
    pointToPx.x = pointFromPx.x - pointToPx.x * mult;
    pointToPx.y = pointFromPx.y - pointToPx.y * mult;

    return {
        from: (new Vector2D(pointFromPx)).toInt(),
        to: (new Vector2D(pointToPx)).toInt()
    };
};

bckMap.prototype.calcLineToNextTileCoorPxByDir = function(fromTile, dir, mult){
    mult = mult||1;

    var pointFromPx = this.calcDrawBase(fromTile.tile[Tile.param.posTMpx], true),
        pointToPx = new Vector2D(Tile.dispPxArr[0].x / this.map.zoom, (Tile.dispPxArr[0].y + this.getHillHeightOffset()) / this.map.zoom);

    pointToPx.doMultScalar(mult);
    pointToPx.mult(Tile.dirsMap[dir]);
    pointToPx.addVector(pointFromPx);

    return {
        from: pointFromPx,
        to: pointToPx
    };
};

    
    bckMap.prototype.getHillHeightOffset = function(){
        return this.hillHeight;
    };

/**********************/
/** Математика дорог **/
/**********************/

bckMap.prototype.getClosestPoint = function(pointA, points, radius){
    if(!radius) radius = 9999;
    var distMin = (radius+1);

    for(var pointX in points){
        pointX = points[pointX];

        var dist = Trade.calcDistance(pointA, pointX);

        if( dist < distMin ){
            distMin = dist;

            var closePoint = pointX;
        }
    }

    return distMin < radius ? closePoint : false;
};

bckMap.prototype.getAngle = function(pointA, pointB, corPersp){//последний параметр - корректировка перспективы с учетом x/y=2
    return Math.atan2(-(pointB.y - pointA.y)*(corPersp?2:1), pointB.x - pointA.x);//минус потому, что y смотрит вниз
};

bckMap.prototype.calcDivAngle = function(a1, a2){
    var div = a2 - a1;
    while(div < 0){
        div += Math.PI * 2;
    }
    while(div > Math.PI * 2){
        div -= Math.PI * 2;
    }
    if(div > Math.PI){
        div -= Math.PI *2
    }
    return div;
}
/*
this.getSqLength = function (pointA, pointB){
    if(!pointB) pointB = this.posTownMT;
    return Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2);
}*/

bckMap.prototype.getPointBesie = function(points, t){
    if(points.length > 2){
        var nextLevel = [];

        for(var i=0; i<points.length-1; i++){
            nextLevel.push({
                x: (points[i+1].x - points[i].x) * t + points[i].x,
                y: (points[i+1].y - points[i].y) * t + points[i].y,
                h: points[i+1].h * t + points[i].h * (1 - t)//высота
            });
        }

        return this.getPointBesie(nextLevel, t);
    }else{
        var pointX = {};

        pointX.t = t;//позиция на кривой
        pointX.Vx = points[1].x - points[0].x;//вектор направления
        pointX.Vy = points[1].y - points[0].y;
        pointX.Va = this.getAngle(points[0],points[1]);//угол направления
        pointX.x = pointX.Vx * t + points[0].x;//координаты
        pointX.y = pointX.Vy * t + points[0].y;
        pointX.h = points[1].h * t + points[0].h * (1 - t);//высота

        return pointX;
    }
}

bckMap.prototype.addControlPointsToBesie = function(points, t, An, Bn){
    for(var i=1; i<points.length-1; i++){
        var A = points[i-1];
        var B = points[i];
        var C = points[i+1];
        var ABdist = Trade.calcDistance(A, B);
        var BCdist = Trade.calcDistance(B, C);

        var fAB = t * ABdist/(ABdist+BCdist);   // scaling factor for triangle Ta
        var fBC = t * BCdist/(ABdist+BCdist);   // ditto for Tb, simplifies to fb=t-fa

        B.C0 = {
            x: Math.round(B.x-fAB*(C.x-A.x)),    // x2-x0 is the width of triangle T
            y: Math.round(B.y-fAB*(C.y-A.y))    // y2-y0 is the height of T
        };
        B.C1 = {
            x: Math.round(B.x+fBC*(C.x-A.x)),
            y: Math.round(B.y+fBC*(C.y-A.y)) 
        };
    }
};

bckMap.prototype.clearWrp = function(){
    this.removeTooltip();

    $(window).off('.mapMove');

    bckMap.superclass.clearWrp.apply(this, arguments);
};

/*************/
/** События **/
/*************/

// Перебираем события для отображения на карте
bckMap.prototype.drawEvents = function(canvas){
    var	list = wofh.events.getList();

    for (var event in list){
        event = list[event];

        if( !this.canShowEvent(event) ) 
            continue;

        var posTMT = Trade.movePointToMap({
                x: event.data.x, 
                y: event.data.y
            }),
            town = wofh.towns[event.getTown1()],
            eventVectors = this.getEventToTownVectors(posTMT, town.pos); // Массив векторов от тайла события до города события (учитывается самоповтор карты)

        this.drawEventVectors(canvas, eventVectors, event);

        this.drawEventLabels(canvas, eventVectors, event);
    }
};

bckMap.prototype.getEventToTownVectors = function(eventPosTMT, townPosTMT){
    var vectors = [],
        minEventPosTMT = eventPosTMT,
        minDist = Trade.calcDistance(eventPosTMT, townPosTMT);

    var repeatedPos = Trade.repeatPointOnMap(eventPosTMT, 1),			
        dist = Trade.calcDistance(repeatedPos, townPosTMT);

    if( dist < minDist ){
        minEventPosTMT = repeatedPos;
        minDist = dist;
    }

    repeatedPos = Trade.repeatPointOnMap(eventPosTMT, -1),			
    dist = Trade.calcDistance(repeatedPos, townPosTMT);

    if( dist < minDist ){
        minEventPosTMT = repeatedPos;
        minDist = dist;
    }

    var minVectorToTown = {
        eventPosTMT: minEventPosTMT,
        townPosTMT: townPosTMT
    };

    vectors.push(minVectorToTown);

    vectors.push({
        eventPosTMT: Trade.repeatPointOnMap(minEventPosTMT, -1),
        townPosTMT: Trade.repeatPointOnMap(townPosTMT, -1)
    });
    vectors.push({
        eventPosTMT: Trade.repeatPointOnMap(minEventPosTMT, 1),
        townPosTMT: Trade.repeatPointOnMap(townPosTMT, 1)
    });

    return vectors;
};

bckMap.prototype.drawEventVectors = function(canvas, eventVectors, event){
    for(var eventVector in eventVectors){
        eventVector = eventVectors[eventVector];

        // Вектор к тайлу события
        var eventTiles = [],
            eventTile = [];

        eventTile[Tile.param.posTMT] = eventVector.eventPosTMT;
        eventTile[Tile.param.posTMpx] = this.getPosTMpxByPosTMT(eventTile[Tile.param.posTMT], true);

        eventTiles.push(eventTile);

        if( event.type == EventCommon.type.makeroad ){
            eventTile = [];

            eventTile[Tile.param.posTMT] = Trade.movePoint(eventVector.eventPosTMT, Tile.dirsMap[event.getRoadDir()]);
            eventTile[Tile.param.posTMpx] = this.getPosTMpxByPosTMT(eventTile[Tile.param.posTMT], true);

            eventTiles.push(eventTile);
        }

        for (var i in eventTiles){
            this.drawEventVector(canvas, eventTiles[i], eventVector.townPosTMT, event);
        }
    }
};

bckMap.prototype.drawEventVector = function(canvas, tile, townPosTMT, event){
    if( this.map.eventSelect == event.id )//выделено событие
        this.drawVector(tile, {pos: townPosTMT}, {color: '#ffb400', noModeCheck: true, canvas: canvas});
    else if( this.map.tileSelect && this.map.tileSelect.tile[Tile.param.town] == event.getTown1() )//выделен город
        this.drawVector(tile, {pos: townPosTMT}, {color: '#ffb400', noModeCheck: true, canvas: canvas});
    else if( this.map.tileSelect && Tile.isSame(this.map.tileSelect.tile, tile) )//выделена цель
        this.drawVector(tile, {pos: townPosTMT}, {color: '#ffb400', noModeCheck: true, canvas: canvas});
    else if( this.map.tileHover && Tile.isSame(this.map.tileHover.tile, tile) )//наведена цель
        this.drawVector(tile, {pos: townPosTMT}, {noModeCheck: true, canvas: canvas});
};

bckMap.prototype.drawEventLabels = function(canvas, eventVectors, event){
    var type = false, 
        envId = false;

    if( event.type == EventCommon.type.maketown )
        type = 'town';
    else if( event.type == EventCommon.type.makeres )
        type = 'dep';
    else if( event.type == EventCommon.type.makeroad )
        type = 'road';
    else if( event.type == EventCommon.type.makeimp ){
        type = 'env';

        envId = event.data.type;
    }
    else if( event.type == EventCommon.type.explore )
        type = 'explore';

    for(var eventVector in eventVectors){
        eventVector = eventVectors[eventVector];

        var tile = this.map.getTile(eventVector.eventPosTMT);

        if( !tile )	
            continue;

        //отрисовка в зависимости от типа
        if( type == 'road' )
            this.drawConstructRoads(canvas, tile, event.getRoadDir(), event.data.level, 'env_ph');
        else{
            if( type == 'dep' )
                envId = (event.data.type = tile[Tile.param.dep]) - 1;

            this.drawConstruct(canvas, tile, type, envId, 'env_ph', false);
        }
    }
};

//можем ли показывать событие - проверяем по типу события и фильтрам
bckMap.prototype.canShowEvent = function(event){
    if ( event.type == EventCommon.type.maketown && !utils.inMask(wMapFilter.filter.town.build, this.map.settings.p_filter2[LS.mapFilter2.town]) ){
        return true;
    }
    if ( event.type == EventCommon.type.makeres && !utils.inMask(wMapFilter.filter.deposit.build, this.map.settings.p_filter2[LS.mapFilter2.deposit]) ){
        return true;
    }
    if ( event.type == EventCommon.type.makeroad && !utils.inMask(wMapFilter.filter.road.build, this.map.settings.p_filter2[LS.mapFilter2.road]) ){
        return true;
    }
    if ( event.type == EventCommon.type.makeimp && !utils.inMask(wMapFilter.filter.mapImp.build, this.map.settings.p_filter2[LS.mapFilter2.mapimp]) ){
        return true;
    }
    if (event.type == EventCommon.type.explore){
        return true;
    }
    return false;
};

//список событий тайла
bckMap.prototype.getTileEvents = function(tile){
    var events = new EventList();

    for (var event in wofh.events.getList()){
        event = wofh.events.getElem(event);

        if (!this.canShowEvent(event)) continue;

        var tiles = event.getAffectedTiles(this.map);

        if (utils.inArray(tiles, tile)){
            events.list.push(event);	
        }
    }

    return events;
};

/*************/
/** Маршрут **/
/*************/

bckMap.prototype.drawRoute = function(){
    var mapRoutes = this.map.mapRoutes,
        route,
        fromTileInfo,
        toTileInfo,
        lineWidth = this.getRouteLineWidth(),
        canvas = this.canvasW;
    
    canvas.save();
    
    for(var route in mapRoutes.list){
        route = mapRoutes.list[route];

        fromTileInfo = {};
        fromTileInfo.begin = true;
        fromTileInfo.tile = mapRoutes.from.tile;
        fromTileInfo.posTMT = fromTileInfo.tile[Tile.param.posTMT];

        for(var dir in route.dirs){
            toTileInfo = {
                end: route.dirs[+dir+1] === undefined, 
                isTunnelDir: route.isTunnelDir(route.dirs[dir])
            };

            dir = route.getDir(dir);

            toTileInfo.posTMT = this.map.getTileTMTByDir(fromTileInfo.posTMT, dir);

            toTileInfo.tile = this.map.getTile(toTileInfo.posTMT);

            toTileInfo.routeInfo = this.getTileRouteInfo(fromTileInfo.tile, toTileInfo.tile, route.type, dir, toTileInfo.isTunnelDir);

            this.drawRouteSegment(canvas, fromTileInfo, toTileInfo, {arrow: {}, lineWidth: lineWidth * (route.active ? 1 : 0.7), globalAlpha:route.active ? 0.8 : 0.6});

            fromTileInfo = toTileInfo;
        }
    }

    this.drawRouteDist(canvas, mapRoutes.from, mapRoutes.to);

    canvas.restore();
};
    
    bckMap.prototype.getRouteLineWidth = function(){
        return 11;
    };
    
bckMap.prototype.drawRouteVector = function(canvas, fromTile, toTile, opt){
    if( !this.canDrawRouteSegment(fromTile.tile, toTile.tile) ) return;

    opt = opt||{};

    var linePx = this.calcTileLineCoorPx(fromTile, toTile);

    if( toTile.routeInfo ){
        opt.strokeStyle = canvas.createLinearGradient(linePx.from.x, linePx.from.y, linePx.to.x, linePx.to.y);

        opt.strokeStyle.addColorStop(0.2, fromTile.tile ? this.getTileRouteColor(fromTile.routeInfo||toTile.routeInfo) : this.routeColors.fog);
        opt.strokeStyle.addColorStop(0.8, toTile.tile ? this.getTileRouteColor(toTile.routeInfo) : this.routeColors.fog);
    }
    canvas.strokeStyle = opt.strokeStyle;
    canvas.lineWidth = opt.lineWidth;
    if( opt.globalAlpha !== undefined ) 
        canvas.globalAlpha = opt.globalAlpha;

    if( opt.shadowColor ){
        canvas.shadowColor = opt.shadowColor;

        canvas.shadowOffsetX = opt.shadowOffsetX||1;
        canvas.shadowOffsetY = opt.shadowOffsetY||1;
    }

    canvas.beginPath();
    canvas.moveTo(linePx.from.x, linePx.from.y);
    canvas.lineTo(linePx.to.x, linePx.to.y);
    canvas.closePath();
    canvas.stroke();

    if( opt.arrow ){
        var vectorDir = linePx.to.getDiffVector(linePx.from);

        opt.arrow.tail = opt.arrow.tail||20;
        opt.arrow.offset = opt.arrow.offset||{x:-(vectorDir.getLength()-opt.arrow.tail)*0.5, y:0};
        if( opt.arrow.shadowColor !== undefined ){
            opt.arrow.shadowOffsetX = opt.arrow.shadowOffsetX||1;
            opt.arrow.shadowOffsetY = opt.arrow.shadowOffsetY||1;
        }
        if( toTile.routeInfo ){
            opt.arrow.fillStyle = 'white';
        }

        this.drawArrow(canvas, linePx.to.clone(), vectorDir.doNormalize(), opt.arrow);
    }

    return linePx;
};

bckMap.prototype.drawRouteCurve = function(canvas, fromTile, toTile, opt){
    opt = opt||{};

    var linePx = this.calcTileLineCoorPx(fromTile, toTile, toTile.closeRoute ? 1 : 0.5);

    toTile.linePx = linePx;

    if( fromTile.linePx ){
        linePx.controlPoint = linePx.from;
        linePx.from = fromTile.linePx.to;
    }

    if( !this.canDrawRouteSegment(fromTile.tile, toTile.tile) ) return;

    if( toTile.routeInfo ){
        opt.strokeStyle = canvas.createLinearGradient(linePx.from.x, linePx.from.y, linePx.to.x, linePx.to.y);

        if( fromTile.tile || toTile.closeRoute )
            opt.fromColor = fromTile.toColor||this.getTileRouteColor(fromTile.routeInfo||toTile.routeInfo);
        else
            opt.fromColor = this.routeColors.fog; // Выходим с тайла с туманов войны

        if( toTile.tile )
            opt.toColor = this.getTileRouteColor(toTile.routeInfo);
        else
            opt.toColor = this.routeColors.fog; // Заходим на тайл с тумано войны

        toTile.toColor = opt.toColor;

        opt.strokeStyle.addColorStop(0.65, opt.fromColor);
        opt.strokeStyle.addColorStop(1, opt.toColor);
    }

    canvas.strokeStyle = opt.strokeStyle;
    canvas.lineWidth = opt.lineWidth;

    if( opt.globalAlpha !== undefined ) 
        canvas.globalAlpha = opt.globalAlpha;

    if( opt.shadowColor ){
        canvas.shadowColor = opt.shadowColor;

        canvas.shadowOffsetX = opt.shadowOffsetX||1;
        canvas.shadowOffsetY = opt.shadowOffsetY||1;
    }

    if( fromTile.begin )
        this.drawRouteEnds(canvas, linePx.from, {lineWidth: opt.lineWidth, color: opt.fromColor});
    if( toTile.closeRoute )
        this.drawRouteEnds(canvas, linePx.to, {lineWidth: opt.lineWidth, color: opt.toColor});

    canvas.beginPath();
    canvas.moveTo(linePx.from.x, linePx.from.y);
    if( fromTile.begin || toTile.closeRoute )
        canvas.lineTo(linePx.to.x, linePx.to.y);
    else if( linePx.controlPoint )
        canvas.quadraticCurveTo(linePx.controlPoint.x, linePx.controlPoint.y, linePx.to.x, linePx.to.y);
    canvas.stroke();

    if( opt.arrow && linePx.controlPoint && !toTile.closeRoute ){
        var vectorDir = linePx.to.getDiffVector(linePx.controlPoint);

        if( opt.arrow.shadowColor !== undefined ){
            opt.arrow.shadowOffsetX = opt.arrow.shadowOffsetX||1;
            opt.arrow.shadowOffsetY = opt.arrow.shadowOffsetY||1;
        }
        if( toTile.routeInfo )
            opt.arrow.fillStyle = 'white';

        this.drawArrowCurve(canvas, linePx, vectorDir.doNormalize(), opt.arrow);
    }

    if( toTile.end ){
        toTile.end = false;
        toTile.closeRoute = true;

        if( !fromTile.begin ){
            if( fromTile.linePx )
                fromTile.linePx.to = linePx.to;

            fromTile.toColor = toTile.toColor;
        }

        this.drawRouteCurve(canvas, fromTile, toTile, opt);
    }
};

bckMap.prototype.drawRouteSegment = bckMap.prototype.drawRouteCurve;

bckMap.prototype.canDrawRouteSegment = function(fromTile, toTile){
    if( fromTile || toTile )
        return true;

    return false;
};

bckMap.prototype.drawRouteDist = function(canvas, fromTile, toTile){
    this.saveCanvasStyles(canvas);

    var linePx = this.drawRouteVector(canvas, fromTile, toTile, {lineWidth:2, strokeStyle:'#ffe400', shadowColor:'black'});

    var vectorDir = linePx.to.getDiffVector(linePx.from),
        arrow = {},
        distLength = vectorDir.getLength(),
        labelDist = 300,
        labelsCount = 1,
        labelStart = distLength * 0.5;

    if( distLength > 450 ){
        labelsCount = utils.toInt(distLength/labelDist);

        if( labelsCount > 1 ) 
            labelStart = 150;
    }

    // Иконка линейки (над текстом)
    var imgRuler = {};
    imgRuler.img = new Image();
    imgRuler.img.src = 'https://test.waysofhistory.com/img/gui/icons/icons_tgwetc-a-5.png';
    imgRuler.sOffset = {x:31, y:41};
    imgRuler.dSize = imgRuler.size = {w:13, h:6};
    imgRuler.posOffsetPx = {x:-imgRuler.size.w*0.5, y:-15};

    for(var i = 0; i < labelsCount; i++){
        // Стрелка
        arrow.tail = 20;
        arrow.offset = {x:-10 - labelStart - (i*labelDist), y:-15};
        this.drawArrow(canvas, linePx.to.clone(), vectorDir.doNormalize(), arrow);

        // Дистанция (текст + возвращается позиция для иконки линейки)
        imgRuler.posPx = this.drawText(canvas, linePx.to.moveAlongLineInDir(linePx.from, -labelStart - (i*labelDist)), Trade.roundDistance(Trade.calcMapDistance(fromTile.posTMT, toTile.posTMT)));

        this.drawImage(canvas, imgRuler.img, imgRuler.sOffset.x, imgRuler.sOffset.y, imgRuler.size.w, imgRuler.size.h, Math.round(imgRuler.posPx.x+imgRuler.posOffsetPx.x), Math.round(imgRuler.posPx.y+imgRuler.posOffsetPx.y), imgRuler.dSize.w, imgRuler.dSize.h);
    }

    // Маркеры конеца и начала маршрута
    this.drawRouteMarkers(canvas, linePx);

    this.restoreCanvasStyles(canvas);
};

bckMap.prototype.drawRouteMarkers = function(canvas, linePx, opt){
    opt = opt||{};
    opt.height = opt.height||20;
    opt.size = opt.size||{w:7, h:5};

    this.saveCanvasStyles(canvas, ['fillStyle', 'strokeStyle', 'shadowColor']);

    canvas.shadowColor = 'transparent';

    // 1 маркер - красный флажок
    canvas.strokeStyle = canvas.fillStyle = 'red';

    var startPointPx = linePx.from;

    canvas.beginPath();
    canvas.moveTo(startPointPx.x, startPointPx.y);
    canvas.lineTo(startPointPx.x, startPointPx.y - opt.height);
    canvas.stroke();
    canvas.lineTo(startPointPx.x - opt.size.w, startPointPx.y - opt.height + opt.size.h);
    canvas.lineTo(startPointPx.x, startPointPx.y - opt.height + (opt.size.h<<1));
    canvas.fill();

    // 2 маркер - синий флажок
    canvas.strokeStyle = canvas.fillStyle = 'blue';

    startPointPx = linePx.to;

    canvas.beginPath();
    canvas.moveTo(startPointPx.x, startPointPx.y);
    canvas.lineTo(startPointPx.x, startPointPx.y - opt.height);
    canvas.stroke();
    canvas.lineTo(startPointPx.x - opt.size.w, startPointPx.y - opt.height + opt.size.h);
    canvas.lineTo(startPointPx.x, startPointPx.y - opt.height + (opt.size.h<<1));
    canvas.fill();

    this.restoreCanvasStyles(canvas);
};

bckMap.prototype.drawRouteEnds = function(canvas, point, opt){
    this.saveCanvasStyles(canvas, ['fillStyle', 'lineWidth']);

    canvas.lineWidth = 1;
    canvas.fillStyle = opt.color;

    canvas.beginPath();
    canvas.arc(point.x, point.y, utils.toInt(opt.lineWidth * 0.5), 0, 6.28);
    canvas.fill();

    this.restoreCanvasStyles(canvas);
};

bckMap.prototype.getTileRouteInfo = function(fromTile, toTile, routeType, dir, isTunnelDir){
    if( !this.canDrawRouteSegment(fromTile, toTile) ) return;

    var speed = Tile.move.hv,
        routeInfo = {type: routeType};

    if( routeType == Route.types.land ){
        if( isTunnelDir ){
            routeInfo.tunnelRoute = true;

            return routeInfo;
        }

        // fromTile и toTile могут отсутствовать если маршрут проходит через туман войны
        if( fromTile && toTile ){
            if( Tile.isMoveThroughRiver(fromTile, toTile, dir) ){
                speed += Tile.move.land.obstacles.river;

                var bridge = false;

                // В режиме дороги и мосты. Мосты учитываются при любом пересечении реки, даже на тех тайлах где его нельзя построить 
                if( this.map.mapRoutes.mode.bridge ){
                    bridge = new MapImp(MapImp.ids.bridge, this.map.routeMode.bridge);
                }
                else
                    bridge = Tile.getTileImp(toTile, MapImp.ids.bridge);
            }
            if( toTile[Tile.param.dep] != lib.map.nodeposit )
                speed *= Tile.move.land.obstacles.dep;
            if( toTile[Tile.param.terrain] == 1 )
                speed *= Tile.move.land.obstacles.h;
            if( toTile[Tile.param.terrain] == 2 )
                speed *= (Tile.move.land.obstacles.m + 0.1); // 0.1 добаляется для раскраски гор в красное

            // Учет дорог
            if( this.map.mapRoutes.mode.id != Route.modeIds.noRoads ){
                // Проверяем наличие дороги со стороны обратной перемещению (0 - нет, 1 - река, 2 - грунтовка и т.д.)
                var road = this.map.mapRoutes.mode.road||(Tile.getRealRoads(toTile)[(dir+4)%8] - 1);

                // Такая ситуация возможна только при выезде из тоннеля. Ускорение тоннеля в данном случае не учитывается.
                if( road == Road.ids.tunnel )
                    road = 0;

                if( road > 0 ){
                    if( bridge && bridge.canUp() )
                        road = Math.min(road, bridge.getLevel());

                    road = new Road(road);

                    if( !road.isRiver() )
                        speed *= road.getSpeed();
                }
            }
        }
    }
    else
        speed *= Tile.move.water.mult[Tile.tileRiverCount(toTile||fromTile)?'river':'water'];

    routeInfo.speed = speed;

    return routeInfo;
};

bckMap.prototype.getTileRouteColor = function(routeInfo){
    if( routeInfo.tunnelRoute )
        return this.routeColors.tunnel; // Тоннель красится всегда в черное
    if( routeInfo.type == Route.types.land ){
        var colorIndex = Math.ceil(((routeInfo.speed/Tile.move.maxSpeed) * 0.5) * 10) - 1;

        return this.routeColors.land[Math.min(colorIndex, this.routeColors.land.length-1)];
    }
    else
        return this.routeColors.water[routeInfo.type == Route.types.water?0:1];
};





bckMap.prototype.drawArrow = function(canvas, startPoint, vectorDir, opt){
    opt = opt||{};
    opt.width = opt.width||6;
    opt.height = opt.height||2;

    if( opt.offset ){
        if( opt.offset.x )
            startPoint.addVector(vectorDir.getMultScalar(opt.offset.x));
        if( opt.offset.y )
            startPoint.addVector(vectorDir.getPerp().doMultScalar(opt.offset.y));
    }

    var nextPoint = vectorDir.getMultScalar(-opt.width).addVector(startPoint), // Смещаемся в обратном направления (ширина стрелки)
        vectorDirPerp = vectorDir.getPerp().doMultScalar(opt.height); // Находим перпендикуляр (высота стрелки)

    this.saveCanvasStyles(canvas, ['fillStyle', 'strokeStyle', 'lineWidth', 'shadowColor']);

    canvas.fillStyle = opt.fillStyle;
    if( opt.shadowColor ){
        canvas.shadowColor = opt.shadowColor;

        canvas.shadowOffsetX = opt.shadowOffsetX||1;
        canvas.shadowOffsetY = opt.shadowOffsetY||1;
    }

    canvas.beginPath();
    canvas.moveTo(startPoint.x, startPoint.y);
    canvas.lineTo(nextPoint.x + vectorDirPerp.x, nextPoint.y + vectorDirPerp.y);
    canvas.lineTo(nextPoint.x - vectorDirPerp.x, nextPoint.y - vectorDirPerp.y);
    canvas.fill();

    // Рисуем хвост
    if( opt.tail ){
        nextPoint = vectorDir.getMultScalar(-(opt.width+opt.tail)).addVector(startPoint);

        if( opt.tailGradColors ){
            opt.strokeStyle = canvas.createLinearGradient(nextPoint.x, nextPoint.y, startPoint.x, startPoint.y);

            opt.strokeStyle.addColorStop(opt.tailGradColors[0].offset, opt.tailGradColors[0].color);
            opt.strokeStyle.addColorStop(opt.tailGradColors[1].offset, opt.tailGradColors[1].color);
        }
        canvas.strokeStyle = opt.strokeStyle||opt.fillStyle;
        canvas.lineWidth = opt.lineWidth||2;

        canvas.moveTo(startPoint.x, startPoint.y);
        canvas.lineTo(nextPoint.x, nextPoint.y);
        canvas.stroke();
    }

    this.restoreCanvasStyles(canvas);
};

bckMap.prototype.drawArrowCurve = function(canvas, linePx, vectorDir, opt){
    opt = opt||{};
    opt.width = opt.width||8;
    opt.height = opt.height||3;

    var startPoint = linePx.to.clone();

    if( opt.offset ){
        if( opt.offset.x )
            startPoint.addVector(vectorDir.getMultScalar(opt.offset.x));
        if( opt.offset.y )
            startPoint.addVector(vectorDir.getPerp().doMultScalar(opt.offset.y));
    }

    var nextPoint = vectorDir.getMultScalar(-opt.width).addVector(startPoint), // Смещаемся в обратном направления (ширина наконечника стрелки)
        vectorDirPerp = vectorDir.getPerp().doMultScalar(opt.height); // Находим перпендикуляр (высота наконечника стрелки)

    this.saveCanvasStyles(canvas, ['fillStyle', 'strokeStyle', 'lineWidth', 'shadowColor']);

    canvas.fillStyle = opt.fillStyle;
    if( opt.shadowColor ){
        canvas.shadowColor = opt.shadowColor;

        canvas.shadowOffsetX = opt.shadowOffsetX||1;
        canvas.shadowOffsetY = opt.shadowOffsetY||1;
    }

    canvas.lineWidth = 3;

    canvas.beginPath();
    canvas.moveTo(startPoint.x, startPoint.y);
    canvas.lineTo(nextPoint.x + vectorDirPerp.x, nextPoint.y + vectorDirPerp.y);
    canvas.lineTo(nextPoint.x - vectorDirPerp.x, nextPoint.y - vectorDirPerp.y);
    canvas.fill();

    // Рисуем хвост
    var grad = canvas.createLinearGradient(linePx.from.x, linePx.from.y, linePx.to.x, linePx.to.y);

    grad.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(0.7, 'rgba(255, 255, 255, 1)');

    canvas.strokeStyle = grad;

    canvas.beginPath();
    canvas.moveTo(linePx.from.x, linePx.from.y);
    canvas.quadraticCurveTo(linePx.controlPoint.x, linePx.controlPoint.y, linePx.to.x, linePx.to.y);
    canvas.stroke();

    this.restoreCanvasStyles(canvas);
};

bckMap.prototype.drawText = function(canvas, pointPx, text, opt){
    opt = opt||{};

    this.saveCanvasStyles(canvas, false, ['font', 'textAlign', 'textBaseline']);

    canvas.font = opt.font||'12px Tahoma';
    canvas.textAlign = 'center';
    canvas.textBaseline = 'middle';
    canvas.strokeStyle = opt.strokeStyle||'white';
    canvas.lineWidth = opt.lineWidth||3;

    canvas.strokeText(text, pointPx.x, pointPx.y);

    canvas.fillStyle = opt.fillStyle||'black';
    canvas.shadowColor = opt.shadowColor||'white';
    canvas.shadowBlur = opt.shadowBlur||7;

    canvas.fillText(text, pointPx.x, pointPx.y);

    this.restoreCanvasStyles(canvas);

    return pointPx;
};

bckMap.prototype.saveCanvasStyles = function(canvas, list, addList){
    list = list||['strokeStyle', 'fillStyle', 'lineWidth', 'shadowColor', 'shadowBlur'];
    if( addList )
        list = list.concat(addList);

    var savedStyles = {list:{}};

    for( var param in list ){
        param = list[param];
        savedStyles.list[param] = canvas[param];
    }

    if( canvas.savedStyles )
        savedStyles.parent = canvas.savedStyles;

    canvas.savedStyles = savedStyles;
};

bckMap.prototype.restoreCanvasStyles = function(canvas){
    for( var param in canvas.savedStyles.list )
        canvas[param] = canvas.savedStyles.list[param];

    if( canvas.savedStyles.parent )
        canvas.savedStyles = canvas.savedStyles.parent;
    else
        delete canvas.savedStyles;
};