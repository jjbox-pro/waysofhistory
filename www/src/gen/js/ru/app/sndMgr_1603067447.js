

/*******************
 * Менеджер звуков *
 *******************/

SndMgr = function(){
	var self = this;
	
	this.list = []; // Список звуковых источников 
	
	this.init = function(){
		self.setGlobalVolume();
		
		if( Howler.ctx && Howler.ctx.state == 'running' )
			this.initSoundSources();
		else
			$(document).one('click', function(){
				self.initSoundSources();
			});
		
		return this;
	};
    
	this.initSoundSources = function(){
		if( SndMgr.storageGlobalVolume() ){
			this.addSnd(MusicSnd); // Сразу добавляем и включаем фоновую музыку
			this.addSnd(EventSnd); // Добавляем источник событийных звуков
			this.addSnd(AmbientSnd); // Сразу добавляем и включаем фоновые звук
			this.addSnd(NoiseSnd); // Сразу добавляем и включаем фоновые короткие звуки

			notifMgr.addListener(Notif.ids.sndEnable, 'sound', function(sndType){
				self.setEnable(undefined, sndType);
			});
			notifMgr.addListener(Notif.ids.sndVolume, 'sound', function(sndType){
				self.setVolume(sndType.storageVolume(), sndType);
			});

			this.inited = true;
		}
	};
	
	this.getSndList = function() {
        var list = [];
        for (var snd in this.list) {
            snd = this.list[snd];
            if (snd instanceof Snd) {
                list.push(snd);
            }
        }
        return list;
    };
	
	this.removeSnd = function(Snd){
		
	};
    
	this.refreshSnd = function(){
        var list = this.getSndList();
        for(var snd in list){
			list[snd].reload();
        }
    };
    
	this.getSndByType = function(type){
		var list = [];
		for (var snd in this.list) {
			snd = this.list[snd];
			if (snd.constructor == type) {
				list.push(snd);
			}
		}
        
		return list;
	};
    
	this.getFirstSndByType = function(type){
		for (var snd in this.list) {
			snd = this.list[snd];
			
			if (snd.constructor == type) {
				return snd;
			}
		}
		
		return false;
	};
    
	this.getLength = function(){
        return this.list.length;
	};
    
	this.isEmpty = function(){
        return !this.list.length;
	};
	
	this.addSnd = function(type){
		var data = type.prepareData();
		
		if( !data ) return;
		
        var snd = new type();
		
		snd.init(); // Источник всегда инициализируем
		
		this.list.push(snd);
		
		return snd;
	};
	
	this.stopAllSnd = function(){
        for (var snd in this.list) {
            this.list[snd].stop();
        }
		
		this.stoped = true;
	};
	
	this.playAllSnd = function(){
        for (var snd in this.list) {
            this.list[snd].play();
        }
		
		this.stoped = false;
	};
	
	this.playEventSnd = function(eventOrTrack, data){
		var eventSnd = this.getFirstSndByType(EventSnd);
		
		if( !eventSnd ) return;
		
		var track = eventOrTrack instanceof Track ? eventOrTrack : EventSnd.trackList[eventOrTrack];
		
		if( track instanceof Function )
			track = track(data);
		else if( utils.isArray(track) )
			track = track[utils.random(track.length)]; // Если массив, выбираем рандомно
		
		eventSnd.play(track);
	};
	
	this.stopEventSnd = function(event, data){
		var eventSnd = this.getFirstSndByType(EventSnd);
		
		if( !eventSnd ) return;
		
		eventSnd.stop();
	};
	
	this.getBuildTrack = function(build){
		var tracks = EventSnd.buildTrackList[build.id];
        if( !tracks || !tracks.length ) return false;
		
		return tracks[utils.random(tracks.length)]; // Выбираем рандомно по количеству треков для домиков
	};
	
	this.setEnable = function(enable, type) {
		var snd = this.getFirstSndByType(type);
		
		if( !snd )
			this.addSnd(type);
		else
			snd.setEnable(enable);
	};
	
	this.setVolume = function(val, type) {
		var snd = this.getFirstSndByType(type);
		
		if( snd )
			snd.setVolume(val);
	};
	
	this.setGlobalVolume = function(val, checkAllSnd) {
		val = +(val !== undefined ? val : SndMgr.storageGlobalVolume());
		
		Howler.volume(val);
		
		if( checkAllSnd ){
			if( val ){
				if( !this.inited )
					this.init();
				else if( this.stoped )
					this.playAllSnd();
			}
			else
				this.stopAllSnd();
		}
	};
	
	this.getGlobalVolume = function() {
		return Howler.volume();
	};
	
	this.getRandomTrack = function(list){
		var count = utils.sizeOf(list),
			random = utils.random(count);
		
		var i = 0;
		for(var track in list){
			if( random == i++ )
				return list[track];
		};
				
	};
    
	this.vibrate = function(duration){
		try{
			window.navigator.vibrate(duration);
		}
		catch(e){}
	};
};

SndMgr.storageGlobalVolume = function(val, callback){
	if( val === undefined )
		return ls.getAudioGlobalVolume(Snd.volume.def);
	else{
		ls.setAudioGlobalVolume(val);
		
		if( callback ) callback();
		
		return;
	}
};