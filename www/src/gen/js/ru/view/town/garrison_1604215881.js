/**
	Панель с гарнизоном
*/

pGarrison = function(){
	pGarrison.superclass.constructor.apply(this, arguments);
};

utils.extend(pGarrison, Panel);
	
	
	pGarrison.canDisplay = function(){
		return wofh.account.ability.get(Ability.ids.attack);
	};
	
	
    pGarrison.prototype.calcName = function(){
        return 'garrison';
    };
    
    pGarrison.prototype.calcChildren = function() {
        this.children.garrison = bGarrison_list;
    };

    pGarrison.prototype.addNotif = function(){
        this.notif.show = [
			{id: Notif.ids.accAbilities, params: Ability.ids.attack},
			{id: Notif.ids.accQuests, params: lib.quest.ability.sendarmy}
		];
    };

    pGarrison.prototype.bindEvent = function() {
        this.wrp.on('click', '.garrison-list-scroll', function(event){
            if( $(event.target).is('a, a *') ) return;
			
			if( Quest.isAvail(lib.quest.ability.sendarmy) )
				wndMgr.addWnd(wArmy);
        });  
    };
    
    pGarrison.prototype.canDisplay = function() {
        return pGarrison.canDisplay();
    };
	
	pGarrison.prototype.afterDraw = function(){
        this.initScroll({
			cls: '.garrison-list-scroll', 
			advanced: {
				autoUpdateTimeout: 1000
			},
			autoUpdateTimeout: 1000
		});
    };
	
	pGarrison.prototype.afterShow = function(){
		this.parent.tryResize(0);
	};
	
	
	pGarrison.prototype.isFooterLarge = function(){
		return true;
	};
	
    pGarrison.prototype.getContHeight = function(){
        if( this.cont )
            return this.cont.find('.garrison-list-scroll').height();
        else
            return 0;
    };

    pGarrison.prototype.getContRealHeight = function(){
        if( this.cont ) 
            return this.cont.find('#garrison-list').height();
        else
            return 0;
    };

    pGarrison.prototype.setContHeight = function(height, updScroll){
        if( this.cont ){
            this.cont.find('.garrison-list-scroll').height(height);
			
			if( updScroll )
				this.updScroll(true);
		}
    };
	
    pGarrison.prototype.checkDispType = function(){
        if( !this.garrison )
            return;
		
        var prevType = this.garrison.showFull;
        
		this.garrison.checkDispType();
		
        if( prevType != this.garrison.showFull )
            this.garrison.show();
    };

	
    //список юнитов
    bGarrison_list = function(parent){
        this.name = 'garrison';
        bGarrison_list.superclass.constructor.apply(this, arguments);
    };
        utils.extend(bGarrison_list, Block);

        bGarrison_list.prototype.addNotif = function(){
            this.notif.show = [Notif.ids.townGarrison];
        };

        bGarrison_list.prototype.getData = function(){
            this.data.list = wofh.town.getGarrisonWithEvents().sortByDefault(true);
            
            this.checkDispType();

            this.dataReceived();
        };

        bGarrison_list.prototype.getTmplData = function(){
            return {list: this.data.list, full: this.showFull};
        };

        //вид отображается в двух вариантах - полном и сокращённом. Эта функция выбирает нужный вариант
        bGarrison_list.prototype.checkDispType = function(){
            if( !this.data || !this.data.list ) return;
			
            //число типов юнитов
            var count = this.data.list.getLength();

            var unitHeight = 29;
            var availHeight = this.parent.getContHeight();
			
            this.showFull = (availHeight-12) / count > unitHeight;
        };

        bGarrison_list.prototype.afterDraw = function(){
            this.setItemWidth();
        };

        bGarrison_list.prototype.setItemWidth = function(){
            // Установка ширины блоков с описаниями юнитов
			utils.getElemSize(this.wrp, {callback: function($wrp){
				var width = 0,
					$li = $wrp.find('li');
				
				$li.each(function(){
					width = Math.max(width, $(this).width());
				});

				$li.width(width);	
			}});
        };