/******
 * Сортировка таблицы по колонкам
 */


//контент, функция, которая будет срабатывать при сортировке, сортировка по умолчанию
//функция сортировки получает значение поля и направление сортировки
Table = function(parent, cont){
    this.linkClass = '.js-colSort';
    this.linkField = 'field';
    
    this.parent = parent;
    this.cont = cont;//контейнер
    this.field = '';//поле по которому сортируем
    this.dirDown = true;//направление сортировки
    this.filter = {};
    
    this.options = {
        useScroll: false,//подключается встроенный скролл
        useBlocks: false,//использовать разбивку на блоки
        blockSize: 30,//размер блока в строчках
        rowHeight: 0//высота строки - для вычисления высоты блока
    };
    
    this.data = this.data||this.getData();
    this.data.options = this.options;
	
	if( this.parent && this.parent.appendTable )
		this.parent.appendTable(this);
};


Table.prototype.initWrp = function(){
    if (!this.tmpl.wrp || this.wrpInited)
		return;
	
	this.cont.html(this.tmpl.wrp(this.data));
	
	if( this.options.useScroll && (!this.scroll || !this.scroll.length) )
		this.initScroll();
	
	this.onWrpInit();
	
    this.wrpInited = true;
};

Table.prototype.onWrpInit = function(){};

Table.prototype.bind = function(){
    var self = this;
    
    this.cont.on('click', this.linkClass, function(){
        var field = $(this).data(self.linkField);
        if (field) {
            self.toggleSort(field);
        }
    });	
};




//включить сортировку, направление сортировки можно не указывать
Table.prototype.toggleSort = function(field, dirDown){
    var self = this;
    
    if (typeof(dirDown) == 'undefined')
        this.dirDown = this.field != field ? this.getDefSortDir(field) : !this.dirDown;
    else
        this.dirDown = dirDown;
    
    this.field = field;
    
    this.cont.find(this.linkClass).each(function(){
        var btn = $(this);
        
        btn.removeClass('-active').removeClass('-dir-up').removeClass('-dir-down');
		
        var btnField = btn.data(self.linkField);
		
        if (btnField == self.field) {
            var dirDown = self.dirDown;
            btn.addClass('-active');
        } else {
            var dirDown = self.getDefSortDir(btnField);
        }
		
        btn.addClass(dirDown ? '-dir-down' : '-dir-up');
    });
    
    this.show();
	
	this.scrollTop();
};

//получение данных
Table.prototype.getData = function(){
    if (this.data) return this.data;
    if (this.parent && this.parent.data) return this.parent.data;
    if (this.parent && this.parent.getData) return this.parent.getData();
    return {};
}

//сотрировка данных
Table.prototype.sortData = function() {
    var self = this, aVal, bVal, val;
    
    if( !this.field )
		return;
    
    this.data.list.sort(function(a, b){
        //фильтрация
        if( a.filter && !b.filter ) return -1;
        if( !a.filter && b.filter ) return 1;
        
        aVal = self.getSortVal(a, self.field);
        bVal = self.getSortVal(b, self.field);
        
        if( aVal == bVal ){
			// Если данные одинаковые, сортируем по умолчанию или по другому полю
            aVal = self.getSortVal(a, '', self.field, b);
            bVal = self.getSortVal(b, '', self.field, a);
        }
        
		if( aVal == bVal )
			return 0;
		
		if( self.dirDown )
			val = aVal < bVal;
		else
			val = aVal > bVal;
		
        return val ? 1 : -1;;
    });
};

//перерисовка внутренностей
Table.prototype.show = function(){
	this.beforeShow();
	
    if( this.options.useScroll && !this.scroll )
		this.initScroll();
    
    this.prepareData();
    
    this.sortData();
    
    if( this.options.useBlocks )
        this.splitBlocks();
    
	this.afterSort();
    
    this.initWrp(); // Возможно эта функция расположен здесь а не в bind для возможности динамического изменения контента таблицы
    
	this.tblCont = this.calcTblCont();
	
    var tmpl = this.tmpl.main||this.tmpl;
	
    this.tblCont.html(tmpl(this.data));
    
    if( this.options.useBlocks )
        this.calcBlocksHeight();
    
    this.tblCont.html(tmpl(this.data));
    
	if( this.options.useBlocks )
	   this.$blocks = this.tblCont.find('> .tbl-block');
	
    this.display();
    
	this.afterDraw();
};

//отображение
Table.prototype.display = function(){
	if( this.options.useBlocks )
        this.showBlocks();
};


Table.prototype.splitBlocks = function() {
    this.data.blocks = [];
    
    //разбивка строчек на блоки
    for (var row in this.data.list) {
        row = this.data.list[row];
		
        if ( row.show === false || row.show === 0 ) continue;
		
        if ( this.data.blocks.length == 0 || this.data.blocks[this.data.blocks.length-1].list.length == this.options.blockSize )
            this.data.blocks.push({i: this.data.blocks.length, list: []});
        
        this.data.blocks[this.data.blocks.length-1].list.push(row);
    }
};

Table.prototype.calcBlocksHeight = function(withUpd){
    for (var blockId in this.data.blocks) {
        var block = this.data.blocks[blockId];
		
        if( this.options.rowHeight )
            block.height = block.list.length * this.options.rowHeight;
        else{
            var blockEl = this.toggleBlock(blockId, true);
			
            block.height = this.calcBlockHeight(blockEl, withUpd);
			
            this.toggleBlock(blockId, false);
        }
    }
};

Table.prototype.calcBlockHeight = function(blockEl, withUpd){
	if( withUpd )
		blockEl.height('');
	
	var height = utils.getElemSize(blockEl).height;
	
	if( withUpd )
		blockEl.height(height);
	
    return height;
};

Table.prototype.updBlocks = function(){
	if( !this.options.useBlocks )
		return;
	
    this.calcBlocksHeight(true);
	
	this.showBlocks();
};

Table.prototype.showBlocks = function(){
    //сохраняем, что после обновления скролла нужно будет ещё раз обновить блоки
    if( this.scroll )
        this.scrollUpdBlocks = true;

   this.checkBlocksVisibility();
};

Table.prototype.toggleBlock = function($block, show){
	if( typeof($block) == 'string' )
		$block = this.tblCont.find('> .tbl-block[data-id="'+$block+'"]');
    
    if( show ){
        if( $block.html().length <= 1 ){
            this.data.block = this.data.blocks[$block.data('id')];
			
            $block.html(this.tmpl.block(this.data));
        }
    } 
	else
        $block.empty();
    
    return $block;
};

Table.prototype.getBlockHeight = function(){
	return (this.data.block||{}).height||0;
};


Table.prototype.toggleFilter = function(field, val){
    //проверяем, есть ли уже фильтрация по этому полю
    if (!this.filter[field]) {
        this.filter[field] = [];
    }
    var filter = this.filter[field];
    
    //ищем, есть ли фильтр с таким значением
    var find = false;
    for (var param in filter) {   
        if (filter[param] == val) {
            filter.splice(param, 1);
			
            if (utils.sizeOf(filter) == 0){
                delete this.filter[field];
            }
			
            find = true;
        }
    }
    if (!find)
        filter.push(val);
    
    this.scrollTop();
	
    this.show();
};

Table.prototype.toggleFilterRange = function(field, min, max){
    
    //проверяем, есть ли уже фильтрация по этому полю
    if (!this.filter[field]) {
        this.filter[field] = {};
    }
    var filter = this.filter[field];
    
    filter.range = true;
    filter.min = min;
    filter.max = max;
    
    this.scrollTop();
    this.show();
};

//отключает сортировку, если поле не задано или текущая сортировка по заданному полю
Table.prototype.turnOffSort = function(field, noUpd){
    if (this.field == field) {
        this.toggleSort('', true);
    } else if(!noUpd){
        this.show();
    }
};

Table.prototype.getMaxVal = function(field){
    var max = 0;
    for (var row in this.data.list){
        row = this.data.list[row];
        max = Math.max(max, this.getSortVal(row, field));
    }
    return max;
}

//заглушка для переопределения - перед показом данных
Table.prototype.prepareData = function(){};

//заглушка для вызова функции после фильтрации и вставки контента
Table.prototype.afterSort = function(){};

//заглушка для вызова функции до фильтрации и вставки контента
Table.prototype.beforeShow = function(){};

//заглушка для вызова функции после фильтрации и вставки контента
Table.prototype.afterDraw = function(){};

//фильтрация по умолчанию
Table.prototype.getDefSortDir = function(field){
    return true;//всегда сверху-вниз
};

//запросить данные, выполнить колбэк
Table.prototype.reqData = function(callback){
    callback();
};

Table.prototype.onScroll = function(){
	this.display();
};


Table.prototype.initScroll = function(){
    var self = this;

    var el = this.cont.find('.tbl-tbody');

    if( el.length == 0 )
        return;

    this.scroll = IScroll.add(el, {
        scrollbarPosition: 'outside', 
        callbacks: {
            onScroll: function(){
                self.onScroll();

                console.log('onScroll');
            },
            onResize: function(){
                if( !self.scrollUpdBlocks )
                    return;

                self.showBlocks();

                delete self.scrollUpdBlocks;

                console.log('onResize');
            }
        }
    });
};

Table.prototype.calcTblCont = function(){
    if( this.scroll )
        return this.scroll.$getCont();

    return this.cont.find('tbody, .tbl-tbody');
};

Table.prototype.checkBlocksVisibility = function(){
    var self = this;

    this.$blocks.each(function(){
        var $block = $(this),
            show = self.scroll.isBlockInView($block);

        self.toggleBlock($block, show);
    }); 
};

Table.prototype.scrollTop = function(){
    if( this.scroll )
        this.scroll.scrollTo('top');
};

Table.prototype.onRemove = function(){
    if( this.scroll )
        this.scroll.remove();
};

Table.prototype.doScroll = function(method, val, opt){
    if( this.scroll )
        this.scroll.do(method, [val, opt]);

    return this;
};
