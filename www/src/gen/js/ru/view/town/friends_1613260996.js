pFriends = function(){
    this.name = 'friends';
	
	pFriends.superclass.constructor.apply(this, arguments);
    this.tmpl = tmplMgr.friends;
	
    this.listPos = 0;
	
    this.disp = 82;
};

    utils.extend(pFriends, Block);

    pFriends.prototype.bindEvent = function() {
        var self = this;
        this.wrp.on('click', '.friends-new, .friends-empty', function(){
			if( wofh.platform.fullscreenbutton && appl.fullScreen )
				appl.toggleFrame();
			
            if (wofh.platform.name == 'vk') {
                VK.callMethod("showInviteBox");
            } else if (wofh.platform.name == 'fb'){
                FB.ui({
                    method: 'apprequests',
                    message: 'Эгегей! Давай присоединяйся ко мне в Путях Истории. У нас с тобйо наконецто есть шанс порвать прилично так народу...',
					exclude_ids: self.getUsersIds()
                });
            }
        });
        this.wrp.on('click', '.friends-left', function(){
            if(!$(this).hasClass('-disabled')) {
                self.moveList(-1);
            }
        });
        this.wrp.on('click', '.friends-right', function(){
            if(!$(this).hasClass('-disabled')) {
                self.moveList(1);
            }
        });
        this.wrp.on('click', '.friends-toggle', function(){
            self.wrp.find('.view-friends').toggleClass('-expanded');
			
            ls.setFriendsShow(!ls.getFriendsShow(true));
			
            self.setTimeout(function(){
				notifMgr.runEvent(Notif.ids.applResize);
			}, 300);//момент окончания анимации
        });
    };

    pFriends.prototype.initListPos = function() {
        var pos = 0;
		
        for(var i in this.list){
           if(this.list[i].id == wofh.account.id) break;
		   
           pos++;
        }
		
        pos -= utils.toInt(this.maxLen/2);
        
		this.moveList(Math.max(0, Math.min(pos, this.maxLen - pos)));
    };

    pFriends.prototype.moveList = function(val) {
        this.listPos += val;
        var list = this.cont.find('.friends-list');
		
        list.animate({left: -this.listPos * this.disp}, 100);
		
        this.cont.find('.friends-left').toggleClass('-disabled', this.listPos == 0)
        
		this.cont.find('.friends-right').toggleClass('-disabled', utils.sizeOf(this.users) == this.listPos+this.maxLen)
    };
	
    pFriends.prototype.resize = function() {
        this.maxLen = utils.toInt((this.cont.width() - 80) / this.disp);
		
        this.showList();
    };


    pFriends.prototype.showList = function() {
        if(!this.list) return;
		
        var list = utils.clone(this.list);
		
        while(list.length < this.maxLen)
            list.push({empty: true});

        this.fillListToSize();
		
        this.cont.find('.friends-cont').html(tmplMgr.friends.list({users: list, maxLen: this.maxLen}));

        this.cont.find('.friends-listWrp').width(this.disp * this.maxLen - 4);
    };

    pFriends.prototype.getTmplData = function() {
        var self = this;
		
		this.wait = 0;
		
		// Данные по друзьям уже были получены
		if( wofh.platform.friendsStorage ){
			self.setTimeout(function(){
				self.wait++;
				
				self.onDataLoaded();
			}, 1);
			
			return;
		}
			
        try{
            if (wofh.platform.name == 'vk')
                this.getFriendsIdsVK();
            else if (wofh.platform.name == 'fb'){
                if( FB.authorized )
                    this.getFriendsIdsFB();
                else
                    notifMgr.addListener(Notif.ids.platformFBinited, 'friends', function(){
                        self.getFriendsIdsFB();
                    });
            }
        } 
		catch(err){}
    };

    pFriends.prototype.getFriendsIdsVK = function() {
        var self = this;
		
        VK.api('friends.getAppUsers', {v: '5.124'}, function(appData) {
            if (appData.response) {
                var uidsArr = appData.response;

                uidsArr.push(wofh.account.externalid.slice(3));
				
                self.getRates(uidsArr);
                self.getProfilesVK(uidsArr);
            }
        });
    };

    pFriends.prototype.getFriendsIdsFB = function() {
        var self = this;
		
        wofh.platform.getPermission('user_friends', function(){
            FB.api('/me/friends', function(response) {
                if (response.data) {
                    var uidsArr = [];
                    
					for (var user in response.data){
                        var user = response.data[user];
                        uidsArr.push(user.id);
                    }
					
                    uidsArr.push(wofh.account.externalid.slice(3));
					
                    self.getRates(uidsArr);
                    self.getProfilesFB(uidsArr);
                }
            });
        });
    };

    pFriends.prototype.getRates = function(accountsIds) {
        var self = this;
		
		this.wait++;
		
        reqMgr.getSingleRate(accountsIds, wofh.platform.name+'_', function(resp){
            self.rate = resp.rate;
			
            self.onDataLoaded();
        });
    };

    pFriends.prototype.getProfilesVK = function(accountsIds) {
        var self = this;
		
		this.wait++;
		
        VK.api('users.get', {v: '5.124', user_ids: accountsIds.join(','), fields: 'first_name, last_name, photo'}, function(usersData) {
            if (usersData.response) {
                self.users = {};
				
                for(var user in usersData.response){
                    user = usersData.response[user];
                    self.users[user.id] = user;
                }
				
                self.onDataLoaded();
            }
        });
    };

    pFriends.prototype.getProfilesFB = function(accountsIds) {
        var self = this;
		
        self.users = {};
        for (var user in accountsIds){
            self.users[accountsIds[user]] = {};
        }    
		
		this.wait++;
		
        FB.api('/', {ids: accountsIds.join(','), fields: 'first_name, last_name, cover, picture'}, function(usersData) {
            for(var userId in usersData){
                var user = usersData[userId];
                self.users[userId].first_name = user.first_name;
                self.users[userId].last_name = user.last_name;
				self.users[userId].photo = user.picture.data.url;
            }
			
			self.onDataLoaded();
        });
    };
	
	
    pFriends.prototype.onDataLoaded = function() {
        if( --this.wait ) return;
		
		if( wofh.platform.friendsStorage )
			this.list = wofh.platform.friendsStorage.list;
		else{
			this.list = [];

			for(var userId in this.users){
				var user = this.users[userId];

				var rate = this.rate[wofh.platform.name+'_'+userId];
				if (rate){
					user.rate = rate.rate;
					user.id = rate.id;
				}else {
					user.id = false;
				}

				this.list.push(user);
			}
			
			delete this.rate;
			
			wofh.platform.friendsStorage = {list: utils.clone(this.list)};
		}
		
        this.list.sort(function(a, b){
            if ((a.rate||0) != (b.rate||0)){
                return (a.rate||0) < (b.rate||0) ? 1: -1;
            }
			
            return a.uid>b.uid ? 1: -1;
        });

        this.data = {users: this.list, maxLen: this.maxLen};

        this.showList();
		
        this.initListPos();
		
        notifMgr.runEvent(Notif.ids.applResize);

        pFriends.resizeDependComponent();
    };

    pFriends.prototype.fillListToSize = function() {
        console.log('pFriends.prototype.fillListToSize', this.list, this.list.length, this.maxLen)
        //дополняем до минимума
    }
	
	pFriends.prototype.getUsersIds = function() {
        var usersIds = [];
		
		for(var userId in this.users)
			usersIds.push(userId);
		
		return usersIds;
    };
	
    // Пересчет размеров компонентов высота которых зависит от высоты панели с друзьями
    pFriends.resizeDependComponent = function() {
        wndMgr.interfaces.town.chat.doResize();
		wndMgr.interfaces.town.loadIndicator.resize();
    };