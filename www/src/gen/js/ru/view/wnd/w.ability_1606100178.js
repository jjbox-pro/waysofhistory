wAbility = function(id){
	wAbility.superclass.constructor.apply(this, arguments);
	
	this.initTimerTime();
};

utils.extend(wAbility, Wnd);


wAbility.ids = {};
wAbility.ids[Ability.ids.map] = {
    name: 'Карта местности',
    link: HashMgr.getHref('#/help/map'),
    about: 'Дает возможность сориентироваться на местности, колонизировать многочисленные месторождения. Помогает строить новые города, заключать союзы и вести кровопролитные войны.'
};
wAbility.ids[Ability.ids.report] = {
    name: 'Отчеты о событиях',
    about: 'Теперь ничто не ускользнет от твоего внимания. Торговые сделки и изученные науки. Военные операции и основания новых городов. Здесь всегда найдешь отчеты о всех значимых событиях в твоих городах.'
};
wAbility.ids[Ability.ids.message] = {
    name: 'Почтовая служба',
    about: 'Возможность написать соседу или обратиться к целой стране? Отправить поздравление или настрочить гневное послание? Любое письмо моментально будет доставлено адресату.'
};
wAbility.ids[Ability.ids.rate] = {
    name: 'Рейтинги',
    about: 'Здесь собраны самые актуальные рейтинги всех городов, игроков и целых стран. Они помогут объективно оценить место каждого в этом мире.'
};
wAbility.ids[Ability.ids.country] = {
    name: 'Страна',
    link: HashMgr.getHref('#/help/country'),
    about: 'Объединение в страны важный и необходимый шаг. Здесь же собрана вся информация о твоей стране. О руководстве, законах, налогах и выплатах.'
};
wAbility.ids[Ability.ids.science] = {
    name: 'Изучение наук',
    link: HashMgr.getHref('#/help/learn'),
    about: 'Здесь всегда можно увидеть какая наука, и с какой скоростью изучается на данный момент. Построить планы развития и получить прогноз по научному развитию на будущее.'
};
wAbility.ids[Ability.ids.money] = {
    name: 'Деньги',
    about: 'Тебе стал доступен новый ресурс — '+snip.resBig(Resource.ids.money)+'деньги. А это новые возможности и в развитии города, и в <a class="link" href="'+HashMgr.getHref('#/help/trade')+'" target="_blank">торговле</a>. Здесь можно увидеть подробную информацию по всем финансам твоих городов, существующие кредиты и вклады страны.',
};
wAbility.ids[Ability.ids.towns] = {
    name: 'Царь-аккаунт. Обзор городов',
    about: 'Великолепная возможность увидеть состояние промышленности, армии, торговли, застройки по всем своим городам. И тут же ты можешь сразу заказать войска, выставить предложения на рынок, построить любое здание в любом городе и сделать еще массу всяких полезных дел.'
};
wAbility.ids[Ability.ids.trade] = {
    name: 'Торговля и транспортировка',
    link: HashMgr.getHref('#/help/trade'),
    about: 'Используя своих торговцев, можешь здесь организовать транспортировку ресурсов между городами. Продать или купить товар на рынке, а позднее организовать снабжение. Позже именно рынок станет для тебя важным источником зарабатывания денег.'
};
wAbility.ids[Ability.ids.attack] = {
    name: 'Атака на город',
    link: HashMgr.getHref('#/help/battle'),
    about: 'Внимание! Сейчас на твой город вышла в атаку вражеская армия. Но не беспокойся, у тебя еще есть время подготовиться. Все военные события всегда отображаются в виде значка с таймером. В защите будут участвовать все войска находящиеся в городе. Позднее тебе станет доступна более подробная информация обо всех перемещениях войск города.'
};
wAbility.ids[Ability.ids.mapVersion] = {
    name: '',
    about: 'У твоей карты есть несколько режимов отображения. От крайне упрощенного до насыщенного деталями.',
    img: 'dummy',
};
wAbility.ids[Ability.ids.specialist] = {
	title: 'В твоих владениях родился ',
    name: snip.icon(snip.c.anyIcon, 'specialist', 'Великий гражданин') + 'Великий Гражданин.',
    link: HashMgr.getHref('#/help/specialists'),
	about: 'Каждый день у тебя есть шанс претендовать на получение случайного Великого Гражданина из Облака Удачи. Как только ты поселишь Великого Гражданина в любой свой город, он усилит его своими способностями.<br>Свободные Великие Граждане не приносят никакой пользы.<br>Ознакомится и расселить по городам всех своих Великих Граждан ты можешь в окне ' + snip.link(HashMgr.getHref('#/bonus'), 'Удача') + '.',
	img: 'dummy',
};
wAbility.ids[Ability.ids.luckSubscription] = {
	title: 'Ты получаешь',
	name: 'Удачу',
	about: 'В этом мире действуют свои правила использования ' + snip.res(Resource.ids.luck) + 'Монет Удачи. Тебе стоит ознакомиться с этим и определиться в своем выборе уже сейчас. На принятие решения время ограничено.',
	toggleText: 'Подробнее '
};

wAbility.prepareData = function(id){	
	return !this.isShownEarlier(id);
};
//был ли показан ранее
wAbility.isShownEarlier = function(id){
    var bitmap = +servBuffer.serv.abil;
    
    return (bitmap&Math.pow(2, id)) > 0;
};


wAbility.prototype.calcName = function(){
    return 'ability';
};

wAbility.prototype.initWndOptions = function(){
    wAbility.superclass.initWndOptions.apply(this, arguments);
	
	this.options.showBack = this.id == Ability.ids.luckSubscription;
	this.options.showBorders = false;
	this.options.showButtons = false;
	this.options.moving = false;
	this.options.noShadow = true;
};

wAbility.prototype.bindEvent = function(){
    var self = this;
    
    this.fixShownEarlier();
    
    this.contIn.waitForImages({
        waitForAll: true,
        finished: function() {
            self.cont.find('.js-timer').html(snip.timer(self.timeout + timeMgr.getNow(), 'dec'));
			
            self.toggleTO = self.setTimeout(self.toggle, self.timeout * 1000);
            
            self.contIn.removeClass('-state-hidden');
			
            self.contIn.addClass('-state-show');
            
            self.getAnimCont().addClass('-type-transition');
        }
    });    
    
    this.wrp.on('click', '.js-toggle', function() {
        self.toggle();
    });
	
    if( Ability.ids.luckSubscription )
        this.wrp.off('click', '.wnd-back-wrp').on('click', '.wnd-back-wrp', function(){
            self.toggle();
        });
};

wAbility.prototype.afterContSet = function(){
	this.contIn = this.wrp.find('.view-'+this.name);
};

wAbility.prototype.getTmplData = function(){
	var data = wAbility.ids[this.id];
	
    data.id = this.id;
	
	return data;
};

wAbility.prototype.afterShow = function(){
	// Обновляем нужные компаненты
	switch(this.id){
		case Ability.ids.science:
			notifMgr.runEvent(Notif.ids.accScience);
            
			break;
	}
    
    this.setTimeout(function(){
        notifMgr.runEvent(Notif.ids.accAbilitiesWnd, this.id);
    }, 0);
};


wAbility.prototype.initTimerTime = function(){
    this.timeout = 30;
};

wAbility.prototype.fixShownEarlier = function(){
    var bitmap = +servBuffer.serv.abil;
    
    bitmap += Math.pow(2, this.id);
    
    servBuffer.temp.abil = bitmap;
	
    servBuffer.apply();
};

wAbility.prototype.toggle = function(){
    var self = this;
	
    this.clearTimeout(this.toggleTO);
    
    this.contIn.addClass('-state-toggle');
    
    this.getAnimCont().css(this.getToggleProp());
    
    this.setTimeout(function() {
		// Обновляем нужные компаненты
		switch(self.id){
			case Ability.ids.luckSubscription:
				wndMgr.addWnd(wBonusSpecial);
				break;
		}
		
        self.close();
		
        appl.showAbil();
    }, 1000);
};


wAbility.prototype.getAnimCont = function(){
	return this.wrp;
};

wAbility.prototype.getToggleProp = function(){
	return {top: this.getTopOffset()};
};

wAbility.prototype.getTopOffset = function(){
	return -110;
};

wAbility.prototype.getImgCenterOffset = function(){
	var $animCont = this.getAnimCont(),
        animContOffset = $animCont.offset(),
        $img = $animCont.find('.wndAbil-img'),
        imgOffset = $img.offset();

    return {
        top: -(animContOffset.top - (imgOffset.top + $img.height() * 0.5)),
        left: -(animContOffset.left - (imgOffset.left + $img.width() * 0.5))
    };
};