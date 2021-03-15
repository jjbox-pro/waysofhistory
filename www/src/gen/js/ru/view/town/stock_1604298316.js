pStock = function(){
	pStock.superclass.constructor.apply(this, arguments);
};

utils.extend(pStock, Panel);


pStock.canDisplay = function(){
    return Quest.isAvail(Quest.ids.bldHouse1);
};


pStock.prototype.calcName = function(){
    return 'stock';
};

pStock.prototype.calcChildren = function(){    
    this.children.static = bStock_static;
    this.children.list = bStock_list;
    this.children.capacity = bStock_capacity;
};

pStock.prototype.addNotif = function(){
    this.notif.show = [Notif.ids.accQuests, Notif.ids.accTownBonus];
};

pStock.prototype.canDisplay = function(){
    return pStock.canDisplay();
};

pStock.prototype.bindEvent = function(){
    var self = this;

    this.wrp
        .on('click', '.stock-list, .stock-static', function(event){
            self.showEconomy();
        })
        .on('mouseover', '.stock-food', function(){
            self.cont.find('.stock-highlight.-grown').addClass('-active')
        })
        .on('mouseout', '.stock-food', function(){
            self.cont.find('.stock-highlight').removeClass('-active')
        })
        //бонус
        .on('click', '.stock-addBonus', function() {
            var type = +$(this).data('type');
            var town = wofh.town;
            var bonus = town.getLuckBonus(type);

            wBonusTakeNow.show(bonus);

            return false;
        });
};

pStock.prototype.afterDraw = function(){
    if( Town.hasDefMoment(wofh.town.army) )
        this.cont.addClass('-type-hasDef');

    this.initScroll({
        cls: '.stock-list-list-wrp', 
        advanced: {
            autoUpdateTimeout: 1000
        },
        autoUpdateTimeout: 1000
    });
};

pStock.prototype.getContHeight = function(){
    if( this.cont )
        return this.cont.find('.stock-list-list-wrp').height();
    else
        return 0;
};

pStock.prototype.setContHeight = function(height, updScroll){
    if( this.cont ){
        this.cont.find('.stock-list-list-wrp').height(height);

        if( updScroll )
            this.updScroll(true);
    }
};

//для кликера - получение позиции элемента
pStock.prototype.getResEl = function(resId) {
    return this.cont.find('.resBig[data-id="' + resId + '"]');
};

pStock.prototype.showEconomy = function() {
    if( Ability.showEconomy() )
        hashMgr.showWnd('economics', 'stock');
};

//вместимость

bStock_capacity = function(parent){
    this.name = 'capacity';
    bStock_capacity.superclass.constructor.apply(this, arguments);
};

utils.extend(bStock_capacity, Block);

bStock_capacity.prototype.addNotif = function(){
    this.notif.show = [Notif.ids.townStockCapacity, {id: Notif.ids.accQuests, params: Quest.ids.bldAltair1}];
};

//статический блок

bStock_static = function(parent){
    this.name = 'static';
    bStock_static.superclass.constructor.apply(this, arguments);
};

utils.extend(bStock_static, Block);

    bStock_static.prototype.addNotif = function(){
        this.notif.show = [Notif.ids.townRes, Notif.ids.townResAlter, {id: Notif.ids.accQuests, params: [Quest.ids.bldCollector1, Quest.ids.sciSelect]}];

        this.notif.other[Notif.ids.townResHas] = function(res){
            if( res.id == Resource.ids.food )
                this.cont.find('#res' + res.id + ' .stock-rest').html(utils.formatNum(res.has, {floor: true, stages: true}));
        };
    };

    bStock_static.prototype.getData = function(){
        this.data =  wofh.town.stock;

        this.dataReceived();
    };

    bStock_static.prototype.bindEvent = function(){
        var self = this;

        //приоритет потребления растишек
        this.wrp.on('click', '.stock-foodPriority', function(event){
            //addWnd

            return false;
        });
    };

//блок списка

bStock_list = function(parent){
    bStock_list.superclass.constructor.apply(this, arguments);

    this.newTownsConsLists = {};
};
    
utils.extend(bStock_list, Block);


bStock_list.prototype.calcName = function(){
    return 'list';
};

bStock_list.prototype.addNotif = function(){
    this.notif.show = [
        Notif.ids.townRes, 
        Notif.ids.townResAlter, 
        {id: Notif.ids.accQuests, params: Quest.ids.bldCollector1},
        Notif.ids.accBonus//админские чекеры и прочий стафф
    ];

    this.notif.other[Notif.ids.townResHas] = function(res){
        if( !this.cont ) return;

        var $res = this.cont.find('#res' + res.id);

        $res.find('.stock-rest .-warn').replaceWith(snip.resStockWarnHas(res));
        $res.find('.stock-scale-rest-wrp').html(tmplMgr.stock.restScale({res:res, town:res.town}));

        if( wofh.account.isPremium() )
            $res.find('.stock-period-wrp').html(tmplMgr.stock.period({res:res}));
    };
};

bStock_list.prototype.getData = function(){
    this.data.filter = 'stock';
    // Сперва берём новый список потребления (на тот случай когда панель склада обновилась до отправки новых списков на сервер)
    this.data.consList = this.newTownsConsLists[wofh.town.id]||wofh.town.stock.getConsBinList();

    if( !this.data.consList.sentResList )
        this.data.consList.sentResList = {};

    this.dataReceived();
};

bStock_list.prototype.getTmplData = function() {
    var data = {};

    data.resGroups = wofh.town.stock.getResGroups(ls.getStockGroups([1,2,3,4]));
    // Показываем потреблялки
    data.showConsumpt = wofh.account.isPremium() && Quest.isAvail(lib.quest.ability.consumption);

    data.consList = this.data.consList;

    if( data.showConsumpt )
        data.canConsumpt = this.canConsumpt(data.consList.getLength());

    return data;
};

bStock_list.prototype.bindEvent = function(){
    var self = this;

    //потребление ресов
    this.wrp
        .on('click', '.stock-res-cons', function(event){
            clearTimeout(self.resConsumptionTO);

            var consList = self.newTownsConsLists[wofh.town.id];

            // Устанавливаем новый список потребления для текущего города
            if( !consList )
                consList = self.newTownsConsLists[wofh.town.id] = self.data.consList;

            var resId = $(this).closest('.stock-list-item').data('id');

            if( consList.sentResList[resId] ){
                delete consList.sentResList[resId];

                $(this).removeClass('-state-sending');
            }
            else{
                consList.sentResList[resId] = true;

                $(this).addClass('-state-sending');
            }

            consList.toggleElem(wofh.town.getRes(resId));

            self
                .cont
                .find('input:not(:checked)')
                .attr('disabled', !self.canConsumpt(consList.getLength()));

            if( !utils.sizeOf(consList.sentResList) )
                delete self.newTownsConsLists[wofh.town.id];

            if( utils.sizeOf(self.newTownsConsLists) ){
                self.resConsumptionTO = setTimeout(function(){
                    // Отправляем новые списки потребления по городам (99% всегда будет только один город)
                    for(var town in self.newTownsConsLists){
                        reqMgr.resConsumption(self.newTownsConsLists[town].getList(), undefined, town);
                    }

                    self.newTownsConsLists = {};
                }, 1500);
            }

            event.stopPropagation();
        })
        //передвинуть группу
        .on('click', '.stock-resGroup-moveUp', function(event){
            var groupId = $(this).parents('.stock-resGroup').data('id');
            self.moveGroup(groupId, -1);
        })
        .on('click', '.stock-resGroup-moveDown', function(event){
            var groupId = $(this).parents('.stock-resGroup').data('id');
            self.moveGroup(groupId, 1);
        });
};


bStock_list.prototype.moveGroup = function(groupId, dir){
    var groupsOrder = ls.getStockGroups([1,2,3,4]);

    for (var groupPos in groupsOrder){
        if (groupsOrder[groupPos] == groupId){
            break;
        }
    }
    groupPos = +groupPos;

    var groupId = groupsOrder[groupPos];

    groupsOrder.splice(groupPos, 1);

    groupPos = groupPos + dir;

    groupsOrder.splice(groupPos, 0, groupId);

    ls.setStockGroups(groupsOrder);

    this.show();
};

bStock_list.prototype.canConsumpt = function(consListLength) {
    return consListLength < wofh.town.getStock().calcMaxConsCount();
};
		
