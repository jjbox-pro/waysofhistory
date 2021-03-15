bMapMini = function(parent){
    bMapMini.superclass.constructor.apply(this, arguments);
};

utils.extend(bMapMini, Block);


bMapMini.prototype.calcName = function(){
    return 'mini';
};

bMapMini.prototype.addNotif = function(){
    this.notif.show = [Notif.ids.accMap];
    
    this.notif.other[Notif.ids.mapMove] = this.setMMPos;
    
    if( !this.canDisplay() )
        this.notif.show.push({id: Notif.ids.accQuests, params: Quest.ids.deposit});
};

bMapMini.prototype.getData = function(){
    this.isFullView = wofh.account.map.size[0] == lib.map.size.array && wofh.account.map.size[0] == lib.map.size.array;

    this.mmUrls = {
        clim: 'gen/map/days/'+wofh.account.map.file+'_c.png', 
        pol: 'gen/map/days/'+wofh.account.map.file+'_p.png'
    };

    this.dataReceived();
};

bMapMini.prototype.canDisplay = function(){
    return Ability.mapMini();
};

bMapMini.prototype.bindEvent = function(){
    var self = this;

    //кнопки
    this.wrp
        .on('click', '.minimap_typebut', function(){
            var type = $(this).attr('data-type');

            self.setMMType(type);

            self.getMap().settings.mmap = type;

            ls.setMapMiniType(type);

            self.setMMPos();
        })
        //увеличивалка
        .on('click', '.minimap_bigbut', function(){
            var wrpEl = $('.minimap_wrp');
            var full = !wrpEl.hasClass('extended');
            wrpEl.toggleClass('extended', full);
            self.setMMSize(full);
            self.setMMPos();
        })
        // Установить центрирование карты
        .on('change', '.js-minimap-setCentering', function(e){
            ls.setMapCentering($(this).prop('checked'));
        });

    this.bindMouseEvent();
};

    bMapMini.prototype.bindMouseEvent = function(){
        var self = this;

        this.wrp
            .on('click', '.minimap_map', function(e){
                if( !e.clientX )
                    e.clientX++;

                self.onMouseClick(e);
            });
    };

bMapMini.prototype.afterDraw = function(){
    this.calcMMConst();

    this.setMMType(this.getMap().settings.mmap || 'clim');

    this.setView();
};


bMapMini.prototype.setView = function(){
    this.setMMSize();

    this.loadMMdisp();
};

bMapMini.prototype.loadMMdisp = function(){
    if( !this.dispMMT )
        this.dispMMT = {x: 0, y: 0};

    this.setMMPos();
};

bMapMini.prototype.setMMType = function(name){
    this.wrp.find('.minimap_typebut').removeClass('active');
    this.wrp.find('.minimap_typebut[data-type='+name+']').addClass('active');

    var minimapSrc = reqMgr.prepareRequestUrl(this.mmUrls[name]);

    this.wrp.find('.minimap_img').attr('src', reqMgr.isAbsoluteUrl(minimapSrc) ? minimapSrc : appl.getOriginHost()+'/'+minimapSrc);	

    var map = this.getMap();

    map.settings.mmap = name;
    map.setSettings();
};

bMapMini.prototype.addDispMMT = function(posTMT){
    return {
        x: posTMT.x + this.dispMMT.x,
        y: posTMT.y + this.dispMMT.y
    };
};


/*
Картинка изначально в кривых координатах img
Нормализованная - повернутая картинка nimg
В координатах картинки ipx
В координатах фрейма fpx
*/
bMapMini.prototype.getMap = function(){
    return this.parent;
};

bMapMini.prototype.calcMMConst = function(){
    //максимальные размеры контента повернутой картинки (остальное - черные полосы и самоповтор)
    this.maxImgNCont = {};
    this.maxImgNCont.x = Math.SQRT2 * lib.map.size.x;
    this.maxImgNCont.y = Math.SQRT2 * lib.map.size.y;		

    // Диагонали - верхняя и нижняя
    this.diagImgN = {};
    this.diagImgN.top = lib.map.size.x;
    this.diagImgN.bottom = this.diagImgN.top + this.maxImgNCont.y * Math.SQRT2;

    // Проверяем есть ли у картинки карты самоповтор
    this.hasRepeat = wofh.account.map.size[0] > lib.map.size.x;

    this.wrp.find('.minimap_imgSize').toggleClass('-has-repeat', this.hasRepeat);
};

bMapMini.prototype.setMMSize = function(fullSize){
    this.fullSize = fullSize;

    //расчёт фрейма
    this.resizeFrame();

    //установка размеров картинки
    var imgSize = {x: wofh.account.map.size[0], y: wofh.account.map.size[1]};//размер картинки как есть

    this.imgNxy = (imgSize.x + imgSize.y) * Math.SQRT1_2;//ширина-высота повернутой картинки - 

    //вычисляем размеры контента и смещение по вертикали (смещение по горизонтиали будет симметричным)
    var imgCont = {};

    if( wofh.account.map.b != undefined ){
        //считаем диагонали верхнего-левого и нижнего-правого углов
        var topDiag = wofh.account.map.b + wofh.account.map.x + wofh.account.map.y;
        var botDiag = topDiag + imgSize.x + imgSize.y;

        //какой отступ срезаемой части должен быть сверху-снизу (у повернутой картинки)
        imgCont.top = Math.SQRT1_2 * Math.max(0, this.diagImgN.top - topDiag);
        imgCont.bottom = Math.SQRT1_2 * Math.max(0, botDiag - this.diagImgN.bottom);

        imgCont.height = Math.SQRT1_2 * (Math.min(botDiag, this.diagImgN.bottom) - Math.max(topDiag, this.diagImgN.top));
        imgCont.width = Math.min(this.maxImgNCont.x, this.imgNxy);

        //позиция центра (по Y. По X он всегда в центре) откропленной части повернутой картинки относительно всей картинки
        imgCont.centerY = (imgCont.height/2 + imgCont.top) / this.imgNxy;	
    } 
    else{
        imgCont.width = Math.min(this.maxImgNCont.x, this.imgNxy);
        imgCont.height = Math.min(this.maxImgNCont.y, this.imgNxy);

        imgCont.centerY = 0.5;
    }

    this.imgCont = imgCont;

    var scaleX = this.frameSize.x / imgCont.width;
    var scaleY = this.frameSize.y / imgCont.height;

    // Смещение изображение по X, чтобы карта корректно репитилась. Позицианируем так, чтобы опорная точка была в центре фрейма.
    // (imgSize.y - imgSize.x) * 0.5 * Math.SQRT1_2 - учёт искажения ширины и высоты самой картинки
    // (wofh.account.map.x - wofh.account.map.y) * Math.SQRT1_2 - учёт позиции опорной точки (позиция относительно левого верхнего угла картинки)
    imgCont.offsetX = ((imgSize.y - imgSize.x) * 0.5 * Math.SQRT1_2 - (wofh.account.map.x - wofh.account.map.y) * Math.SQRT1_2) * scaleX;

    this.scale = Math.min(scaleX, scaleY);//масштаб - во сколько картинка должна быть увеличина

    var imgSizeScaled = {
        x: this.scale * imgSize.x, 
        y: this.scale * imgSize.y
    };//размер отмасштабированной картинки

    //на сколько смещается по вертикали верхний угол при повороте 
    var cornerDisp = (this.imgNxy - imgSize.y) / 2 * this.scale;

    this.wrp.find('.minimap_imgSize').css({
        width: imgSizeScaled.x, 
        height: imgSizeScaled.y, 
        left: -(imgSizeScaled.x * 0.5) - imgCont.offsetX, 
        top: cornerDisp - this.imgNxy * this.scale * imgCont.centerY
    });

    if( this.hasRepeat ){
        var scale = this.scale;

        this.wrp.find('.minimap_repeat').each(function(){
            var orientation = $(this).hasClass('-type-left') ? -1 : 1;

            $(this).css({
                top: -lib.map.size.x * scale * orientation, 
                left: lib.map.size.x * scale * orientation}
            );
        });
    }

    notifMgr.runEvent(Notif.ids.mapIfResize);
};

bMapMini.prototype.resizeFrame = function(){
    var $frame = this.wrp.find('.minimap_wrp').css({height: ''});

    this.frameSize = this.calcFrameSize($frame);

    this.setFrameSize($frame);
};

bMapMini.prototype.calcFrameSize = function($frame){
    var frameSize = {};

    frameSize.y = this.getFrameHeight($frame);
    frameSize.x = frameSize.y * lib.map.size.x / lib.map.size.y;

    return frameSize;
};

bMapMini.prototype.getFrameHeight = function($frame){
    return $frame.height();
};

bMapMini.prototype.setFrameSize = function($frame){
    $frame.css({width: this.frameSize.x, height: this.frameSize.y});
};

bMapMini.prototype.setMMPos = function(){
    if( !this.dispMMT ) return;

    var posMWT = Trade.movePointToMap(this.getMap().posMWT, this.mapMiniClick);

    delete this.mapMiniClick;

    var posTag = {
        x: posMWT.x - wofh.account.map.x,
        y: posMWT.y - wofh.account.map.y
    };

    posTag.x *= this.scale;
    posTag.y *= this.scale;

    this.wrp.find('.minimap_view').css({left: posTag.x, top: posTag.y});
};

bMapMini.prototype.changeMMPos = function(e){
    var frame = this.wrp.find('.minimap_imgCrop'),
        frameOffset = frame.offset();

    var posPx = this.calcClickPos(e, frameOffset);

    //перенос системы в центр
    posPx.x -= this.frameSize.x / 2;
    posPx.y -= this.frameSize.y / 2;

    // Eчёт смещения картинки по X
    posPx.x += this.imgCont.offsetX;

    //учёт смещения угла
    posPx.y += this.imgNxy * this.scale * (this.imgCont.centerY - 0.5);

    //поворот системы
    var posPxRot = {
        x: (posPx.y + posPx.x) * Math.SQRT1_2,
        y: (posPx.y - posPx.x) * Math.SQRT1_2
    };

    // Учёт масштаба фрейма
    posPxRot.x /= this.scale;
    posPxRot.y /= this.scale;

    // Возврат системы из центра с учет масштаба картинки
    posPxRot.x += wofh.account.map.size[0] / 2;
    posPxRot.y += wofh.account.map.size[1] / 2;	

    var posT = posPxRot;

    // Перенос с учетом центра города
    posT.o = this.getMap().posMWT.o;
    posT.x += wofh.account.map.x - this.dispMMT.x;
    posT.y += wofh.account.map.y - this.dispMMT.y;

    posT.x = utils.toInt(posT.x);
    posT.y = utils.toInt(posT.y);

    this.mapMiniClick = true;

    this.getMap().moveTo(posT, {highlight: true});
};

bMapMini.prototype.calcClickPos = function(e, frameOffset){
    var clickPos = this.getClickPos(e);

    return {
        x: clickPos.x - frameOffset.left + wndMgr.$window.scrollLeft(),
        y: clickPos.y - frameOffset.top + wndMgr.$window.scrollTop()
    };
};

bMapMini.prototype.getClickPos = function(e){
    return {x: e.clientX, y: e.clientY};
};

bMapMini.prototype.toggleInTown = function(toggle){
    this.wrp.find('.townbut').toggleClass('-type-opened', toggle);
};


bMapMini.prototype.onMouseClick = function(e){
    this.changeMMPos(e);
};