/**
	Очередь строительства
*/


pBldQueue = function(){
    this.name = 'bldqueue';
	
	pBldQueue.superclass.constructor.apply(this, arguments);
};
	
    utils.extend(pBldQueue, Panel);
	
	pBldQueue.prototype.canDisplay = function(){
        return !wofh.events.getBldQueue().isEmpty();
    };

    pBldQueue.prototype.calcChildren = function(){
        this.children.list = bBldQueue_list;
    };

    pBldQueue.prototype.addNotif = function(){
        this.notif.other[Notif.ids.townBuildQueue] =
		this.notif.other[Notif.ids.townBuildings] = function(){
			this.clearTimeout(this.showTO);
			
			this.showTO = this.setTimeout(this.show, 100);
		};
    };

	pBldQueue.prototype.afterShow = function(){
		this.parent.tryResize(0);
	};
	
	
	
    bBldQueue_list = function(parent){
        this.name = 'list';
		
        bBldQueue_list.superclass.constructor.apply(this, arguments);
    };
        utils.extend(bBldQueue_list, Block);
		
        bBldQueue_list.prototype.addNotif = function(){
            this.notif.other[Notif.ids.townBuildQueuePerc] = function(val){
                if(!this.wrp) return;
				
                var tag = this.wrp.find('#bldqueue-progress');
                
				if (!tag.length) return;

                this.wrp.find('#bldqueue-perc').html(val + '%');
				
                tag.css({height: (100 - val) + '%'});
            };
        };

        bBldQueue_list.prototype.getData = function(){
            this.data.queue = wofh.events.getBldQueue();

            this.dataReceived();
        };

        bBldQueue_list.prototype.getTmplData = function(){
            var data = {};

            if( this.data.queue && this.data.queue.getLength() ){
                data.first = this.data.queue.getFirst();
				
                if( this.data.queue.getLength() > 1 ){
                    data.queue = this.data.queue.clone();
					
                    data.queue.del(0);
                }
            }
			
			this.parent.setHeaderCont(data);
			
            return data;
        };

        bBldQueue_list.prototype.bindEvent = function(){
            var self = this;

            //ускорение строительства
            this.wrp.on('click', '#bldqueue-imm', function(){
                if($(this).hasClass('-disabled')) return;
                var err = wofh.town.slots.canBuildUp();
                if (err.isOk()) {
                    $(this).addClass('-disabled');
                    reqMgr.buildQueueImm();
                } else
                    wndMgr.addAlert(tmplMgr.bldqueue.alert.immediate());
            });

            //отмена строительства
            this.wrp.on('click', '#bldqueue-cancel', function(){
                var parent = $(this).parents('.bldqueue-queue-item');
                var pos = parent.length ? +parent.data('pos') : 0;

                wndMgr.addConfirm(tmplMgr.bldqueue.alert.cancel({event: self.data.queue.getElem(pos)})).onAccept = function(){
                    reqMgr.buildQueueCancel(pos);
                };
            });
        };
		
        bBldQueue_list.prototype.afterDraw = function(){
            if(window.bldPercIterator)
                bldPercIterator.runUpdate();
        };