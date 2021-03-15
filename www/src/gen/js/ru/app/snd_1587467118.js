/****************
 * Базовый звук *
 ****************/

Snd = function(){
	this.volume = Snd.volume.def;
	
	this.track = new Track();
	this.trackList = [];
	this.loop = false;
	this.html5 = false;
	this.autoplay = true;
	this.waiting = false;
	
	this.active = 0;
};

Snd.prepareData = function(){
	return true;
};

Snd.ext = {
	mp3: '.mp3', 
	ogg: '.ogg'
};

Snd.type = {
	music: MusicSnd,
	ambient: AmbientSnd,
	noise: NoiseSnd,
	event: EventSnd
};

Snd.volume = {
	max: 1,
	min: 0,
	def: 0.5
};

Snd.volumeBase = 100;


Snd.prototype.init = function(){
	this.trackVolume = this.volume;
	
	this.controller = this.initController();
};

// Получить объект управляющий звуковыми файлами
Snd.prototype.initController = function(track){
	var self = this;
	
	return new Howl({
		src: (track||this.track).getSrc(),
		loop: this.loop,
		volume: this.volume,
		html5: this.html5,
		autoplay: this.autoplay,
		waiting: this.waiting,
		onload: function(id, msg, controller) {
			self.onLoad(id, msg, controller);
		},
		onplay: function(id, msg, controller) {
			self.active++;
			
			self.onPlay(id, msg, controller);
		},
		onpause: function(id, msg, controller) {
			self.active--;
			
			self.onPause(id, msg, controller);
		},
		onstop: function(id, msg, controller) {
			self.active--;
			
			self.onStop(id, msg, controller);
		},
		onend: function(id, msg, controller) {
			self.active--;
			
			self.onEnd(id, msg, controller);
		},
		onloaderror: function(id, msg, controller) {
			self.onLoadError(id, msg, controller);
		}
	});
};

Snd.prototype.play = function(){
	this.controller.play();
};

Snd.prototype.pause = function(){
	this.controller.pause();
};

Snd.prototype.stop = function(){
	this.controller.stop();
};

Snd.prototype.setTrack = function(track){
	this.track = track||(new Track());
	
	this.controller.src(track.getSrc());
};

Snd.prototype.setVolume = function(volume){
	if( this.volume == volume || volume === undefined ) return;
	
	this.volume = +volume;
	
	if( this.isActive() )
		this.setTrackVolume(this.track);
};

Snd.prototype.setTrackVolume = function(trackOrVolume){
	if( trackOrVolume instanceof Track )
		trackOrVolume = this.volume * trackOrVolume.getFactor();
	
	if( this.trackVolume == trackOrVolume || trackOrVolume === undefined ) return;
	
	this.controller.volume(this.trackVolume = +trackOrVolume);
};

Snd.prototype.getTrack = function(){
	return this.track;
};

Snd.prototype.getVolume = function(){
	return this.volume;
};

Snd.prototype.isPlaying = function(){
	return this.controller.playing();
};

Snd.prototype.isActive = function(){
	return !!this.active;
};

Snd.prototype.onLoad = function(){
	// Устанавливаем уровень звука непосредственно после загрузки файла. Дабы избежать некорректного значения для звука, который долго загружается.
	this.setTrackVolume( this.track );
};

Snd.prototype.onPlay = function(){};

Snd.prototype.onPause = function(){};

Snd.prototype.onStop = function(){};

Snd.prototype.onEnd = function(){};

Snd.prototype.onLoadError = function(){};



/***************************
 * Источник фоновой музыки *
 ***************************/

function MusicSnd(){
	MusicSnd.superclass.constructor.apply(this, arguments);
}

MusicSnd.prepareData = function(){
	return SndMgr.storageGlobalVolume() && MusicSnd.storageVolume() && debug.isTest('later');
};

MusicSnd.storageVolume = function(val){
	return val === undefined ? ls.getAudioMusicVolume(Snd.volume.def) : ls.setAudioMusicVolume(val);
};

MusicSnd.storageEnable = function(val){
	return val === undefined ? ls.getAudioMusicOn() : ls.setAudioMusicOn(val);
};

utils.extend(MusicSnd, Snd);


MusicSnd.prototype.init = function(){
	this.extendTrackList();
	
	this.volume = MusicSnd.storageVolume();
	
	this.html5 = true;
	
	this.trackList = [];
	this.getRandomTrack();
	
	Snd.prototype.init.apply(this);
};

MusicSnd.prototype.playRandomTrack = function() {
	this.setTrack(this.getRandomTrack());
};

MusicSnd.prototype.setEnable = function(enable){
	enable = +(enable !== undefined ? enable : MusicSnd.storageEnable());
	
	if( enable )
		this.playRandomTrack();
	else
		this.stop();
};

MusicSnd.prototype.getRandomTrack = function() {
	if( !this.trackList.length )
		this.trackList = MusicSnd.trackList.slice(0);
	
	var index = utils.random(this.trackList.length);
    
	return this.track = this.trackList.splice(index, 1)[0];
};

MusicSnd.prototype.getTrackName = function(){
	return MusicSnd.storageVolume() ? this.track.name.split('/').pop() : '';
};

MusicSnd.prototype.extendTrackList = function() {
	if( !MusicSnd.trackList.length )
		MusicSnd.trackList.push(new Track(''));
};

MusicSnd.prototype.onEnd = function() {
	MusicSnd.superclass.onEnd.apply(this, arguments);
	
	this.playRandomTrack();
};

MusicSnd.prototype.onPlay = function() {
	MusicSnd.superclass.onPlay.apply(this, arguments);
	
	notifMgr.runEvent(Notif.ids.sndBackChange);
};

MusicSnd.prototype.onStop = function() {
	MusicSnd.superclass.onStop.apply(this, arguments);
	
	notifMgr.runEvent(Notif.ids.sndBackChange);
};



/***************************
 * Источник фоновых звуков *
 ***************************/
 
function AmbientSnd(){
	AmbientSnd.superclass.constructor.apply(this, arguments);
}

AmbientSnd.prepareData = function(){
	return SndMgr.storageGlobalVolume() && AmbientSnd.storageVolume() && debug.isTest('later');
};

AmbientSnd.storageEnable = function(val){
	return val === undefined ? ls.getAudioAmbientOn() : ls.setAudioAmbientOn(val);
};

AmbientSnd.storageVolume = function(val){
	return val === undefined ? ls.getAudioAmbientVolume(Snd.volume.def) : ls.setAudioAmbientVolume(val);
};

utils.extend(AmbientSnd, Snd);


AmbientSnd.prototype.init = function(){
	this.extendTrackList();
	
	this.volume = AmbientSnd.storageVolume();
	
	this.loop = true;
	this.html5 = true;
	this.controllers = [];
	
	for( var track in AmbientSnd.trackList ){
		track = AmbientSnd.trackList[track];
		
		track.data.oldVolume = this.volume;
		
		this.controllers.push(this.initController(track));
	}
};

AmbientSnd.prototype.initController = function(track){
	var controller = AmbientSnd.superclass.initController.apply(this, arguments);
	
	controller.track = track;
	
	return controller;
};

AmbientSnd.prototype.play = function(){
	for( var controller in this.controllers ){
		this.controllers[controller].play();
	}
};

AmbientSnd.prototype.stop = function(){
	for( var controller in this.controllers ){
		this.controllers[controller].stop();
	}
};

AmbientSnd.prototype.pause = function(){
	for( var controller in this.controllers ){
		this.controllers[controller].pause();
	}
};

AmbientSnd.prototype.setVolume = function(volume){
	if( this.volume == volume || volume === undefined ) return;
	
	this.volume = +volume;
	
	if( this.isActive() ){
		for( var controller in this.controllers ){
			controller = this.controllers[controller];
			this.setTrackVolume(controller.track, controller);
		}
	}
};

AmbientSnd.prototype.setTrackVolume = function(track, controller){
	if( !track ) return;
	
	var trackVolume = this.volume * track.getFactor();
	
	if( track.data.oldVolume == trackVolume ) return;
	
	controller.volume(track.data.oldVolume = +trackVolume);
};

AmbientSnd.prototype.setEnable = function(enable){
	enable = +(enable !== undefined ? enable : AmbientSnd.storageEnable());
	
	if( enable )
		this.play();
	else
		this.stop();
};

AmbientSnd.prototype.isPlaying = function(){
	for( var controller in this.controllers ){
		if( this.controllers[controller].playing() )
			return true;
	}
	
	return false;
};

// Временная функция расширения списка компазиций AmbientSnd звуками домиков
AmbientSnd.prototype.extendTrackList = function() {
	if( !wofh.town )
		return;
	
	var slotList = wofh.town.getSlots().getList(),
		tracks,
		added = {};
	
	for(var slot in slotList){
		slot = slotList[slot];
		
		tracks = EventSnd.buildTrackList[slot.id];
		for(var track in tracks){
			track = tracks[track];
			
			if( track.data.type === Snd.type.ambient && !added[slot.id] ){
				added[slot.id] = true;
				
				AmbientSnd.trackList.push(track.clone());
			}
		}
	}
};

AmbientSnd.prototype.onLoad = function(id, msg, controller) {
	this.setTrackVolume(controller.track, controller);
};



/**************************
 * Источник фонового шума *
 **************************/
 
function NoiseSnd(){
	NoiseSnd.superclass.constructor.apply(this, arguments);
}

NoiseSnd.prepareData = function(){
	return SndMgr.storageGlobalVolume() && NoiseSnd.storageVolume() && debug.isTest('later');
};

NoiseSnd.storageEnable = function(val){
	return val === undefined ? ls.getAudioNoiseOn() : ls.setAudioNoiseOn(val);
};

NoiseSnd.storageVolume = function(val){
	return val === undefined ? ls.getAudioNoiseVolume(Snd.volume.def) : ls.setAudioNoiseVolume(val);
};

utils.extend(NoiseSnd, Snd);


NoiseSnd.prototype.init = function(){
	this.extendTrackList();
	
	this.volume = NoiseSnd.storageVolume();
	this.delay = [1, 2]; // Задержка между треками
	
	this.trackList = [];
	this.track = this.getRandomTrack();
	this.autoplay = false;
	
	Snd.prototype.init.apply(this);
};

NoiseSnd.prototype.stop = function(){
	clearTimeout(this.timeOutId);
	
	delete this.timeOutId;
	
	Snd.prototype.stop.apply(this);
};

NoiseSnd.prototype.playRandomTrack = function() {
	this.setTrack(this.getRandomTrack());
};

NoiseSnd.prototype.setEnable = function(enable){
	enable = +(enable !== undefined ? enable : NoiseSnd.storageEnable());
	
	if( enable )
		this.playRandomTrack();
	else
		this.stop();
};

NoiseSnd.prototype.getRandomTrack = function() {
	if( !this.trackList.length )
		this.trackList = NoiseSnd.trackList.slice(0);
	
	var index = utils.random(this.trackList.length);
	
	return this.trackList.splice(index, 1)[0];
};

NoiseSnd.prototype.isActive = function() {
	return !!this.timeOutId;
};

// Временная функция расширения списка компазиций AmbientSnd звуками домиков
NoiseSnd.prototype.extendTrackList = function() {
	if( !wofh.town )
		return;
	
	var slotList = wofh.town.getSlots().getList(),
		tracks;
	
	for(var slot in slotList){
		slot = slotList[slot];
		
		tracks = EventSnd.buildTrackList[slot.id];
		for(var track in tracks){
			track = tracks[track];
			
			if( track.data.type === Snd.type.noise )
				NoiseSnd.trackList.push(track.clone());
		}
	}
	
	if( !NoiseSnd.trackList.length )
		NoiseSnd.trackList.push(new Track(''));
};

NoiseSnd.prototype.onLoad = function() {
	Snd.prototype.onLoad.apply(this);
	
	var self = this,
		delay = this.delay[0] + utils.random(this.delay[1]);
	
	this.timeOutId = setTimeout(function(){
		self.play();
	}, delay * 1000);
};

NoiseSnd.prototype.onEnd = function() {
	Snd.prototype.onEnd.apply(this);
	
	this.playRandomTrack();
};



/******************************
 * Источник событийных звуков *
 ******************************/
 
function EventSnd(){
	EventSnd.superclass.constructor.apply(this, arguments);
}

EventSnd.prepareData = function(){
	return SndMgr.storageGlobalVolume() && EventSnd.storageVolume();
};

EventSnd.storageEnable = function(val){
	return val === undefined ? ls.getAudioEventOn(1) : ls.setAudioEventOn(val);
};

EventSnd.storageVolume = function(val){
	return val === undefined ? ls.getAudioEventVolume(Snd.volume.def) : ls.setAudioEventVolume(val);
};

utils.extend(EventSnd, Snd);


EventSnd.prototype.init = function(){
	this.volume = EventSnd.storageVolume();
	
	this.track = new Track();
	this.waiting = true;
	this.enable = true;
	
	// Инициализируем события
	$(document)
			.on('mouseenter.sound', '.button1, .buttonBuildSlot, .mmenu-btn, .slotbld-switchBtn', function(){
				sndMgr.playEventSnd(EventSnd.events.sysButtonEnter);
			})
			.on('mouseleave.sound', '.button1, .buttonBuildSlot, .mmenu-btn, .slotbld-switchBtn', function(){
				sndMgr.playEventSnd(EventSnd.events.sysButtonLeave);
			})
			.on('click.sound', '.button1, .buttonBuildSlot, .mmenu-btn, .slotbld-switchBtn', function(){
				sndMgr.playEventSnd(EventSnd.events.sysButtonClick);
			})
			.on('mouseenter.sound', '.button2.-type-cancel', function(){
				//sndMgr.playEventSnd(EventSnd.events.sysButtonCloseEnter);
			})
			.on('click.sound', '.button2.-type-cancel', function(){
				sndMgr.playEventSnd(EventSnd.events.sysButtonCloseClick);
			})
			.on('mouseenter.sound', '.link', function(){
				sndMgr.playEventSnd(EventSnd.events.sysTextLinkEnter);
			})
			.on('click.sound', '.link', function(){
				sndMgr.playEventSnd(EventSnd.events.sysTextLinkClick);
			})
			.on('click.sound', 'input:checkbox', function(){
				sndMgr.playEventSnd(EventSnd.events.sysCheckboxClick);
			})
			.on('click.sound', 'input:radio', function(){
				sndMgr.playEventSnd(EventSnd.events.sysRadioClick);
			})
			.on('click.sound', 'select, .mmenu-towns', function(){
				sndMgr.playEventSnd(EventSnd.events.sysSelectClick);
			})
			.on('mouseenter.sound', '.mmenu-towns li', function(){
				sndMgr.playEventSnd(EventSnd.events.sysSelectOptionEnter);
			})
			.on('change.sound', 'select', function(){
				sndMgr.playEventSnd(EventSnd.events.sysSelectOptionChange);
			})
			.on('mouseenter.sound', '.helpIcon', function(){
				sndMgr.playEventSnd(EventSnd.events.sysQuestionEnter);
			})
			.on('mouseenter.sound', '.mmenu-luck', function(){
				sndMgr.playEventSnd(EventSnd.events.sysLuckEnter);
			})
			.on('click.sound', '.mmenu-luck', function(){
				sndMgr.playEventSnd(EventSnd.events.sysLuckClick);
			})
			.on('mouseleave.sound', '.mmenu-luck', function(){
				sndMgr.playEventSnd(EventSnd.events.sysLuckLeave);
			});
			
	
	Snd.prototype.init.apply(this);
};

EventSnd.prototype.play = function(track){
	if( !track || !this.enable )
		return false;
	
	this.setTrack(track);
};

EventSnd.prototype.setEnable = function(enable){
	this.enable = +(enable !== undefined ? enable : !!EventSnd.storageVolume());
};



EventSnd.events = {
	sysWndOpen: 0, // Открытие окна
	sysWndClose: 1, // Закрытие окна
	sysButtonEnter: 2, // Наведение на кнопку
	sysButtonLeave: 3, // Уход с кнопки
	sysButtonClick: 4, // Клик по кнопке
	sysButtonCloseEnter: 5, // Наведение на кнопку закрытия окна
	sysButtonCloseClick: 6, // Нажатие на кнопку закрытия окна
    sysTextLinkEnter: 7, // Наведение на текстовую ссылку
    sysTextLinkClick: 8, // Нажатие на текстовую ссылку
	sysCheckboxClick: 9, // Клик по чекбоксу
	sysRadioClick: 10, // Клик по радио кнопке
	sysSelectOptionEnter: 11, // Наведение на пункт меню
	sysSelectClick: 12, // Клик по выпадающему меню
	sysSelectOptionChange: 13, // Выбор пункта меню
	sysQuestionEnter: 14, // Наведение на вопрос
	sysLuckEnter: 15, // Наведение на удачу
	sysLuckClick: 16, // Клик по удаче
	sysLuckLeave: 17, // Уход с удачи
	townAttack: 300, // Атака на город
	townBuildEnd: 301, // Событие постройки завершено
	townResIncome: 302, // Ресурсы пришли
	townTrainEnd: 303, // Окончание тренировки
	townBattleEnter: 304, // Начало боя
	accMsgNew: 400, // Новое сообщение
	accRepNew: 401, // Новый отчет
};