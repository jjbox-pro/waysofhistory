function Quest (id) {
	this.id = id;
};

utils.extend(Quest, Element);

/**
 * библиотечные методы
 */

Quest.prototype.getRawBonus = function(){
	return lib.quest.list[this.id].bonus;
};

Quest.prototype.getBonusPop = function(){
	return this.getRawBonus().pop;
};

Quest.prototype.getBonusLuck = function(){
	return this.getRawBonus().luck; 
};

Quest.prototype.getBonusRes = function(joinFood){
	var resList = new ResList(this.getRawBonus().res);
	
	return joinFood ? resList.joinFood() : resList;
};

Quest.prototype.getBonusArmy = function(){
	return new Army(this.getRawBonus().army);
};

Quest.prototype.getBonusBuild = function(){
	var rawBuild = this.getRawBonus().build;
	return rawBuild ? new Slot(rawBuild.id, rawBuild.lvl) : false;
};

Quest.prototype.getRule = function () {
	return this.getRawBonus().rule;
};


Quest.prototype.getName = function(){
    return doT.template(this._getAddLib().name)({quest: this});
};

Quest.prototype.getText = function(){
	return doT.template(this._getAddLib().text)({quest: this});
};

Quest.prototype.isInvalid = function(){
	return typeof(lib.quest.list[this.id])=='undefined';
};

/**
 * небиблиотечные методы
 */

Quest.prototype.getGiver = function(){
	var addInfo = this._getAddLib();
	return addInfo && typeof(addInfo.giver) != 'undefined' ? addInfo.giver : Quest.givers.iface;
};

Quest.prototype.getBlinkBuilds = function(){
    var addInfo = this._getAddLib();
    return addInfo.blinkBuilds||[];
};

Quest.prototype.isReferal = function(){
    var addInfo = this._getAddLib();
    return addInfo.referal||false;
};

//Quest.prototype.getBonusOpenMapPost = function(){
Quest.prototype.hasBonusMapPost = function(){//можно писать в тайлы
    return this.getRule() == Quest.rules.announceOpenMap;
};

//Quest.prototype.getBonusOpenMapBattle = function(){
Quest.prototype.hasBonusMapBattle = function(){
    return this.getRule() == Quest.rules.attackOpenMap;
};

//Quest.prototype.getBonusOpenMapClimates = function(){
Quest.prototype.hasBonusMapClimates = function(){//можно видеть климаты
    return this.getRule() == Quest.rules.climatesView;
};

//Quest.prototype.getBonusOpenMapRange = function(){
Quest.prototype.hasBonusMapRange = function(){
    return this.getRule() == Quest.rules.normalView;
};

Quest.prototype.getStatus = function(){
	return wofh.account.quests[this.id];
};

Quest.prototype.setStatus = function(status){
	var arr = wofh.account.quests.split('');
	arr[this.id] = status;
    wofh.account.quests = arr.join('');
    return this;
};

Quest.prototype.isStatusDone = function(){
	return this.getStatus() == Quest.status.done;
};

Quest.prototype.isStatusBonus = function(){
	return this.getStatus() == Quest.status.bonus;
};

Quest.prototype.isStatusActive = function(){
	return this.getStatus() == Quest.status.active;
};

Quest.prototype.isDelayed = function( noStatus ){
	return !(!noStatus && this.isStatusBonus()) && utils.inArray(servBuffer.temp.questsDelayed, this.id);
};

Quest.prototype.addToDelayed = function(callback){
	if( !this.isDelayed(true) ){
		servBuffer.temp.questsDelayed.push(this.id);
		
		servBuffer.apply(callback);
	}
};

Quest.prototype.removeFromDelayed = function(callback){
	if( this.isDelayed(true) ){
		var arr = servBuffer.temp.questsDelayed;
		
		for (var i in arr){
			if ( arr[i] == this.id ){
				arr.splice(i, 1);
				
				break;
			}
		}
		
		servBuffer.apply(callback);
	}
};



Quest.prototype.isStatusUnavail = function(){
    return this.getStatus() == Quest.status.unavail;
};


Quest.getStatus = function(id){
    return wofh.account.quests[id];
};

Quest.isDone = function(id){
	return this.getStatus(id) == Quest.status.done;
};

Quest.isBonus = function(id){
	return this.getStatus(id) == Quest.status.bonus;
};

Quest.isActive = function(id){
	return this.getStatus(id) == Quest.status.active;
};

Quest.isDelayed = function(id){
	return this.getStatus(id) == Quest.status.delayed;
};

Quest.isUnavail = function(id){
	return this.getStatus(id) == Quest.status.unavail;
};

Quest.isAvail = function(id){
    return this.getStatus(id) != Quest.status.unavail;
};

/**
 * константы
 */

Quest.status = {
	done: '+',
	bonus: '$',
	active: '*',
	delayed: '=',
	unavail: '-',
};

Quest.givers = {
	war: 0,
	build: 1,
	viral: 2,
	iface: 3,
	science: 4,
	trade: 5
};

//памятные квесты:)
Quest.ids = {
	reward: 0,
    bldHouse1: 1,
    bldHouse3: 2,
    bldCollector1: 9,
    bldAltair1: 15,
    bldAltair2: 16,
    popSpread: 29,
	popSpread2: 30,
	buildHut: 31,
    clicker: 36,
    resSpend: 37,
    buildInfo: 38,
	buildDestroy: 39,
    map: 42,
    townRename: 43,
    sciSelect: 44,
    sciKnown1: 45,
    makeOffer: 54,
    message: 62,
    mappost: 63,
    referCost: 64,
    luckBonus: 65,
    mathPrice: 70,
    day01092009: 71,
    introduce: 72,
    deposit: 73,
    town2: 74,
	env: 76,
	road: 77,
    country: 78,
    bldPetroglyph1: 82,
    attackBarb: 87,
    unitInfo: 91,
    simulator: 92,
    rep: 102,
    bldImm: 106,
    bldMoat1: 107,
	sciGive4: 48,
};

Quest.rules = {
    no: 0,
    message: 1,
    barbarianAttack: 2,
    announceOpenMap: 3, //обзор вокруг места с объявлением
    attackOpenMap: 4, //обзор вокруг места сражения
    luckEvent: 5,
    addClickers: 6,
    normalView: 7, //нормальный обзор - до того только один тай л вокруг города
    climatesView: 8, //различать климатические зоны
};

Quest.lib = {
	0: {	
        giver: Quest.givers.iface,
        name: 'Начало твоего пути',
        text: 'Приветствую тебя добрый путник. Приятно, что ты навестил старого отшельника. Многие забыли меня. В спешке гонят они время. Не хотят послушать мудрого совета. Моего. Совершают глупые ошибки, хватая только вершки. Не обращают внимания на корешки. А в корешках и живет истинная суть.',
    },// = Награда
	1: {
        giver: Quest.givers.build,
        name: 'Построй {{?!wofh.account.race.is(Race.ids.india)}}хижину{{??}}типи{{?}}',
        text: '{{var bld = new Slot(18).getAlternate();}}Каждый правитель обязан заботиться о жизни своих граждан. Хватит им мокнуть под дождями и стыть на пронизывающих ветрах. <br>Выбери подходящее место и <b>{{?!wofh.account.race.is(Race.ids.india)}}построй хижину{{??}}построй типи{{?}}</b>. {{?!wofh.account.race.is(Race.ids.india)}}Хижина{{??}}Типи{{?}} строится на месте зеленой таблички. Строительство произойдет очень быстро.<br><span class="qinf-text-block -hideMob">{{=snip.emptySlot({blink: true})}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(bld, 1)}}</span>',
        blinkBuilds: [18, 85],
    },// = 1 хижина	
	2: {
        giver: Quest.givers.build,
        name: 'Построй еще 2 {{?!wofh.account.race.is(Race.ids.india)}}хижины{{??}}типи{{?}}',
        text: '{{var bld = new Slot(18).getAlternate();}}Твои люди невероятно трудолюбивы! Они уже справились с постройкой {{?!wofh.account.race.is(Race.ids.india)}}хижины{{??}}типи{{?}}. Теперь им есть, где укрыться от дождя, ветра и палящего солнца и отдохнуть после трудовых подвигов. <br>Но вот незадача — людей становится все больше и одной {{?!wofh.account.race.is(Race.ids.india)}}хижины{{??}}типи{{?}} им уже явно не хватает. <br>Для того, чтобы племя росло быстрее, необходимо помнить об улучшении жилищных условий и строительстве демографических зданий. <b>Построй ещё две новых {{?!wofh.account.race.is(Race.ids.india)}}хижины{{??}}типи{{?}}</b>, чтобы их стало три. <br><span class="qinf-text-block -hideMob">{{=snip.emptySlot({blink: true})}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(bld, 1)}}</span>',
        blinkBuilds: [18, 85],
    },// = 3 хижины	
	3: {
        giver: Quest.givers.build,
        name: 'Улучши {{?!wofh.account.race.is(Race.ids.india)}}хижину{{??}}типи{{?}}',
        text: '{{var bld = new Slot(18).getAlternate();}}Жилья для твоих жителей вполне достаточно, но качество его исполнения оставляет желать большего. Может быть, имеет смысл задуматься над улучшением уже отстроенных {{?!wofh.account.race.is(Race.ids.india)}}хижин{{??}}типи{{?}}? Залатать щели, утеплить пол... <br><b>Улучши любую {{?!wofh.account.race.is(Race.ids.india)}}хижину{{??}}типи{{?}}</b> до 2 уровня<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(bld, 1)}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(bld, 2)}}</span>',
        blinkBuilds: [18, 85],
    },// = Хижина 2 уровня	
	4: {
        giver: Quest.givers.build,
        name: '3 {{?!wofh.account.race.is(Race.ids.india)}}Хижины{{??}}Типи{{?}} 2 уровня',
        text: '{{var bld = new Slot(18).getAlternate();}}Новая {{?!wofh.account.race.is(Race.ids.india)}}хижина{{??}}типи{{?}} вызвала восторг твоих людей. У входа уже выстроилась целая очередь! <br>Потрясающий эффект. Стоит <b>улучшить все три {{?!wofh.account.race.is(Race.ids.india)}}хижины{{??}}типи{{?}} в деревне до 2 уровня</b>.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(bld, 1)}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(bld, 2)}}',
        blinkBuilds: [18, 85],
    },// = 3 хижины 2 уровня	
	5: {
        giver: Quest.givers.build,
        name: '3 {{?!wofh.account.race.is(Race.ids.india)}}Хижины{{??}}Типи{{?}} 4 уровня',
        text: '{{var bld = new Slot(18).getAlternate();}}Великолепно. Но нет предела совершенству. И пусть даже путь к нему займет какое-то время. <b>Улучши все три {{?!wofh.account.race.is(Race.ids.india)}}хижины{{??}}типи{{?}} до четвертого уровня</b>, быть может, и не сразу.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(bld, 2)}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(bld, 3)}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(bld, 4)}}</span>',
        blinkBuilds: [18, 85],
    },// = 3 хижины 4 уровня	
	6: {
        giver: Quest.givers.build,
        name: '3 {{?!wofh.account.race.is(Race.ids.india)}}Хижины{{??}}Типи{{?}} 6 уровня',
        text: '{{var bld = new Slot(18).getAlternate();}}Хорошие жилищные условия - важный повод для улучшения прироста населения в твоем городе. <b>Улучши все три {{?!wofh.account.race.is(Race.ids.india)}}хижины{{??}}типи{{?}} до 6-го уровня</b>. <br>Прирост населения в городе увеличивают все демографические строения. Но каждое со своей эффективностью. Подробную информацию ты всегда найдешь в энциклопедии.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(bld, 6)}}{{=snip.slotImgLevelBigLink(bld, 6)}}{{=snip.slotImgLevelBigLink(bld, 6)}}</span>',
    },// = 3 хижины 6 уровня	
	7: {
        giver: Quest.givers.build,
        name: '3 {{?!wofh.account.race.is(Race.ids.india)}}Хижины{{??}}Типи{{?}} 10 уровня',
        text: '{{var bld = new Slot(18).getAlternate();}}Чем чище и просторней {{?!wofh.account.race.is(Race.ids.india)}}хижины{{??}}типи{{?}}, тем радостней люди предаются невинным забавам, и тем чаще можно услышать в городе крики младенцев. <br><b>Улучши все три {{?!wofh.account.race.is(Race.ids.india)}}хижины{{??}}типи{{?}} до десятого уровня</b>.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(bld, 10)}}{{=snip.slotImgLevelBigLink(bld, 10)}}{{=snip.slotImgLevelBigLink(bld, 10)}}</span>',
    },// = 3 хижины 10 уровня	
	8: {
        giver: Quest.givers.build,
        name: '3 {{?!wofh.account.race.is(Race.ids.india)}}Хижины{{??}}Типи{{?}} 14 уровня',
        text: '{{var bld = new Slot(18).getAlternate();}}Довольные лица твоих соплеменников. Приятное дополнение к удовольствию от обустройства собственного города. Счастливо потирая мозолистые щеки нежными ладошками, <b>улучши-ка три {{?!wofh.account.race.is(Race.ids.india)}}хижины{{??}}типи{{?}} до четырнадцатого уровня</b>. Вот... заколотилось радостно сердце... предвкушает, шальное, добрую работу. <br>Нет ничего важнее для благополучия города, чем люди его населяющие. От количества жителей, в первую очередь, зависит эффективность производства всех ресурсов, от еды и дерева, знаний и денег, до мяса, одежды, драгоценностей и даже урана. Знай же и помни.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(bld, 14)}}{{=snip.slotImgLevelBigLink(bld, 14)}}{{=snip.slotImgLevelBigLink(bld, 14)}}</span>',
    },// = 3 хижины 14 уровня	
	9: {
        giver: Quest.givers.build,
        name: 'Дом собирателя',
        text: 'Люди у тебя запасливые и хозяйственные. <b>Построй дом собирателя</b> на месте любой зеленой таблички и твои жители начнут туда таскать каждую полезную в хозяйстве {{=snip.res(3)}}ветку или найденную в лесу сочную {{=snip.res(11)}}шишку, а ты, как мудрый правитель, сможешь с умом использовать их для развития деревни.<br><span class="qinf-text-block -hideMob">{{=snip.emptySlot({blink: true})}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(96, 1)}}</span>',
        blinkBuilds: [96],
    },// = дом собирателя	
	10: {
        giver: Quest.givers.build,
        name: 'Два дома собирателя',
        text: 'Идея с собирательством оказалась крайне удачной. Появилась возможность добывать ресурсы практически из воздуха. Быть может, стоит удвоить усилия? <b>Построй второй дом собирателя</b> на месте любой зеленой таблички.<br><span class="qinf-text-block -hideMob">{{=snip.emptySlot()}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(96, 1)}}</span>',
        blinkBuilds: [96],
    },// = 2 дома собирателя	
	11: {
        giver: Quest.givers.build,
        name: 'Улучши дома собирателя',
        text: 'Твое поселение стремительно растет. Для строительства требуется еще больше {{=snip.res(2)}}пищи, еще больше {{=snip.res(3)}}древесины! Самое время улучшить оба дома собирателя. <b>Зайди в каждый из них и дай команду на улучшение до 2 уровня</b>. <br>Ты можешь заметить, что улучшать дороже и дольше, чем строить с нуля. Это справедливо для всех первых строений.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(96, 1)}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(96, 2)}}</span>',
        blinkBuilds: [96],
    },// = 2 дома собирателя 2 уровня	
	12: {
        giver: Quest.givers.build,
        name: 'Дома собирателя 4 уровня',
        text: 'Это тот радостный момент, когда необходимое приносит радость. Получая удовольствие от совершенствования собственного города, ты получаешь возможность производить приличное количество ресурсов каждый час. Просто <b>улучши оба Дома собирателя до четвертого уровня</b>.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(96, 2)}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(96, 3)}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(96, 4)}}</span>',
        blinkBuilds: [96],
    },// = 2 дома собирателя 4 уровня	
	13: {
        giver: Quest.givers.build,
        name: 'Дома собирателя 6 уровня',
        text: 'Возможно ты заметил что твои дома собирателся приносят тебе 2 ресурса. Первый это крепкая {{=snip.res(3)}}древесина. Она является важным строительным материалом. А второй это сочные сладкие {{=snip.res(11)}}фрукты. Обрати внимание на то, что в твоем складе находится как ресурс {{=snip.res(11)}}фрукты, так и ресурс {{=snip.res(2)}}пища. Но дело в том что {{=snip.res(2)}}пища не является самостоятельным ресурсом. Она представляет собой совокупность всех ресурсов роста, к которым относится {{=snip.res(12)}}кукуруза, {{=snip.res(13)}}пшеница, {{=snip.res(14)}}рис, {{=snip.res(15)}}рыба, {{=snip.res(16)}}мясо и сами {{=snip.res(11)}}фрукты. <br>А теперь <b>улучши оба дома собирателя до 6 уровня</b> чтобы увеличить количество рабочих мест для производства {{=snip.res(11)}}фруктов и {{=snip.res(3)}}древесины.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(96, 6)}}{{=snip.slotImgLevelBigLink(96, 6)}}</span>',
    },// = 2 дома собирателя 6 уровня	
	14: {
        giver: Quest.givers.build,
        name: 'Дома собирателя 10 уровня',
        text: 'Многие считают, ошибочно, конечно, что собирательство простейшее ремесло. Но ты знаешь, что на каком-то этапе оно превращается в настоящее искусство. Будь творцом, <b>улучши оба Дома собирателя до десятого уровня</b>.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(96, 10)}}{{=snip.slotImgLevelBigLink(96, 10)}}</span>',
    },// = 2 дома собирателя 10 уровня	
	15: {
        giver: Quest.givers.build,
        name: 'Построй алтарь',
        text: 'Твое племя очень быстро растет. Скоро низкий уровень культуры остановит рост населения города. <br>{{=snip.cultEffect()}} Культура города — это его предел по количеству {{=snip.pop()}}населения. <br>Поднимать уровень культуры можно постройкой «культурных» зданий. Например, алтаря. <br>Тебе нужно <b>построить алтарь</b> в специальном месте, обозначенном огромным золотым молотом. Сейчас я подсветил его для тебя голубым цветом.<br><span class="qinf-text-block -hideMob">{{=snip.emptySlot({terrain: Build.slotType.main, blink: true})}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(0, 1)}}</span>'
    },// = Алтарь	
	16: {
        giver: Quest.givers.build,
        name: 'Алтарь 2 уровня',
        text: 'Хватит жить в дикой деревне!<br>Нужно стремиться вперед!<br>Давай поднимем {{=snip.cultEffect()}}культурный уровень твоего племени. <b>Улучши алтарь до второго уровня</b>.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(0, 1)}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(0, 2)}}</span>'
    },// = Алтарь 2 уровня	
	17: {
        giver: Quest.givers.build,
        name: 'Алтарь 4 уровня',
        text: 'Чтобы город мог вместить еще больше {{=snip.pop()}}жителей нужно продолжать увеличивать {{=snip.cultEffect()}}культурный уровень. <b>Улучши свой алтарь до четвертого уровня</b>.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(0, 4)}}</span>'
    },// = Алтарь 4 уровня	
	18: {
        giver: Quest.givers.build,
        name: 'Алтарь 6 уровня',
        text: 'Твои люди уже гордятся тобой. Но ты неостановим в стремлении окультурить своих сограждан по самые макушки. Пусть даже и против их воли. Может пора уже <b>улучшить Алтарь и до шестого уровня</b>?<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(0, 6)}}</span>'
    },// = Алтарь 6 уровня	
	19: {
        giver: Quest.givers.build,
        name: 'Алтарь 10 уровня',
        text: 'Как только ты будешь готов покинуть ряды унылых деревенских старост, возглавляющих, печальные в своем бескультурии и жалком народонаселении, чахлые деревушки — <b>улучши Алтарь до десятого уровня</b>. Быть может тогда, вместе с осознанием важности высокого культурного уровня всех твоих городов, ты получишь Шанс возглавить поистине Город с большой буквы.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(0, 10)}}</span>'
    },// = Алтарь 10 уровня	
	20: {
        giver: Quest.givers.build,
        name: 'Построй обелиск',
        text: 'Величие и грандиозность этого строения вознесет твой город среди соседей. И помимо прочего значительно повысит культурный предел. Построй обелиск в своем городе.<br><span class="qinf-text-block -hideMob">{{=snip.emptySlot()}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(8, 1)}}</span>'
    },// = Обелиск 1 уровня	
	21: {
        giver: Quest.givers.iface,
        name: '50 жителей',
        text: 'Создай благоприятные условия для жизни своих соплеменников. Строй для них жилье, здания увеличивающие {{=snip.growEffect()}}прирост населения. Меняй предел населения, возведением и улучшением зданий повышающих уровень {{=snip.cultEffect()}}культуры. <br>Добейся чтобы общее население всех твоих городов достигло <b>{{=snip.pop()}}50 человек</b>.'
    },// = 50 населения	
	22: {
        giver: Quest.givers.iface,
        name: '100 жителей',
        text: 'Поднимай культурный предел, заботься о своих людях. Именно {{=snip.pop()}}население города дает тебе возможность развиваться. Именно они занимают рабочие места. Из этих простых людей после обучения получаются все лучшие наши воины и строители. Добейся чтобы общее население всех твоих городов достигло <b>{{=snip.pop()}}100 человек</b>.'
    },// = 100 населения	
	23: {
        giver: Quest.givers.iface,
        name: '150 жителей',
        text: 'Совершенствуйся на пути развития своего племени. Первый признак правильно выбранного пути это количество твоих жителей. Добейся чтобы общее население всех твоих городов достигло <b>{{=snip.pop()}}150 человек</b>.'
    },// = 150 населения	
	24: {
        giver: Quest.givers.iface,
        name: '200 жителей',
        text: 'Вопрос: — Что может быть важнее и приятнее {{=snip.pop()}}150 надежных последователей? Именно они заглядывают тебе в рот и, ловя каждое слово, каждый невысказанный приказ обеспечивают жизнедеятельность любого города. <br>Ответ: — {{=snip.pop()}}200 последователей! <br>Увеличь общее население всех своих городов до <b>{{=snip.pop()}}200 человек</b>, чтобы сразу ощутить приятную разницу.'
    },// = 200 населения	
	25: {
        giver: Quest.givers.iface,
        name: '300 жителей',
        text: 'Добейся чтобы общее население всех твоих городов достигло <b>{{=snip.pop()}}300 человек</b>.'
    },// = 300 населения	
	26: {
        giver: Quest.givers.iface,
        name: '500 жителей',
        text: 'А вот как было бы приятно выйти утром на балкон своего дворца и увидеть, услышать, ощутить огромную толпу восторженных людей. И, что характерно, восторженных конкретно тобой. И пусть не глажен твой вихрастый чуб или не полирована глубокомысленная лысина. Они любят тебя. А всего-то надо, подрастить общее население всех своих городов до <b>{{=snip.pop()}}500 человек</b>.'
    },// = 500 населения	
	27: {
        giver: Quest.givers.iface,
        name: '750 жителей',
        text: 'Добейся чтобы общее население всех твоих городов достигло <b>{{=snip.pop()}}750 человек</b>.'
    },// = 750 населения	
	28: {
        giver: Quest.givers.iface,
        name: '1000 жителей',
        text: 'Растущее чувство величия и самоуважения требует новых жертв. Да и есть в тебе силы управлять мудро значительными человеческими массами. Ты знаешь, как и зачем. Ты понимаешь, что чем больше твой город, тем он сильнее и богаче. Тем больше ресурсов добывают твои жители. Тем глубже уважение твоих друзей. Тем сильнее зависть и страх в глазах твоих врагов. Сделай же так, чтобы <b>{{=snip.pop()}}1000 верных соплеменников жили во всех твоих городах</b>.'
    },// = 1000 населения	
	29: {
        giver: Quest.givers.iface,
        name: 'Распредели население',
        text: 'Твои люди слоняются без дела. Ресурсы и знания не производятся. Такими темпами ты отстанешь от всех своих соседей.<br> Возьми в руки бразды правления. <br>Нажми на кнопку распределения населения и <b>отправь всё свободное население на производство</b> самого необходимого сейчас ресурса. <br>Количество свободных работников в городе ограничено. Распределяй людей с умом, ведь чем больше людей работают над производством одного ресурса, тем меньше их останется для производства другого.'
    },// = Распределить население	
	30: {
        giver: Quest.givers.iface,
        name: 'Распредели новое население',
        text: 'Твой город растет. Мест для работы становится больше. А по улицам слоняются без дела лентяи и бездари. <b>Перейди к распределению населения и займи их всех работой</b>. <br>Обрати внимание, ты можешь отправить людей на производства только того ресурса для которого существует специализированное здание. И количество рабочих мест в каждом из них ограничено. <br>Улучшая здание, ты увеличиваешь в нем еще и количество рабочих мест.'
    },// = Распределить население	
	31: {
        giver: Quest.givers.build,
        name: 'Построй землянку',
        text: 'Население города выросло и жители стали добывать еще больше ресурсов. <br>Но скоро их некуда станет складывать. Полезные припасы будут просто гнить под дождями и солнцем. <b>Построй землянку</b>, чтобы увеличить <span class="iconCapacity"></span>вместимость складских помещений города и избежать этой досадной ситуации. Следи за тем, чтобы всегда было свободное место для всех добываемых в городе ресурсов.<br><span class="qinf-text-block -hideMob">{{=snip.emptySlot()}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(2, 1)}}</span>'
    },// = Землянка	
	32: {
        giver: Quest.givers.build,
        name: 'Землянка 2 уровня',
        text: 'Ресурсов стало еще больше и места опять не хватает. Помни, что забота о благосостоянии города и его жителей всегда лежит только на твоих плечах. <br>Самое время <b>улучшить землянку до 2 уровня</b>.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(2, 1)}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(2, 2)}}</span>'
    },// = Землянка 2 уровня	
	33: {
        giver: Quest.givers.build,
        name: 'Землянка 4 уровня',
        text: 'Места много не бывает. Достраивая свою землянку, улучшая ее, ты увеличваешь вместимость городских хранилищ, что дает тебе большую свободу действий. <br><b>Улучши землянку до четвертого уровня</b> как будешь готов.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(2, 2)}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(2, 4)}}</span>'
    },// = Землянка 4 уровня	
	34: {
        giver: Quest.givers.build,
        name: 'Землянка 6 уровня',
        text: 'Качественно отстроенное хранилище это залог спокойного накопления ресурсов. А накопленные ресурсы решают множество сложных ситуаций. <b>Улучши землянку до шестого уровня</b>.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(2, 6)}}</span>'
    },// = Землянка 6 уровня	
	35: {
        giver: Quest.givers.build,
        name: 'Землянка 10 уровня',
        text: 'Строительство современных зданий требует все большего количества ресурсов. И нашей землянки совершенно не хватает под новые запросы. <b>Улучши свою землянку до десятого уровня</b>.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(2, 10)}}</span>'
    },// = Землянка 10 уровня	
	36: {
        giver: Quest.givers.iface,
        name: 'Собери ресурсы',
        text: 'Пока жители заняты укреплением города, осмотрись. <br>Неаккуратные или ленивые строители могли потерять, забыть или растерять ресурсы в укромных уголках долины. <b>Собери их самостоятельно, нажимая на соответствующие таблички на экране города</b>.<br><span class="qinf-text-block -hideMob"><span class="clicker -type-2"></span><span class="clicker -type-3"></span><span class="clicker -type-4"></span><span class="clicker -type-5"></span><span class="clicker -type-6"></span></span>'
    },// = Сбор табличек	 	
	37: {
        giver: Quest.givers.iface,
        name: 'Начни потребление ресурсов',
        text: 'Многие ресурсы являются не только строительным материалом. Большинство ресурсов твои {{=snip.pop()}}люди могут потреблять для получения всевозможных эффектов. От увеличения прироста населения и повышения культурного предела до повышения эффективности твоих ученых. Так например {{=snip.res(16)}}мясо увеличивает {{=snip.growEffect()}}прирост населения на 15%. Замечательно же, правда? <br>Перейди в раздел «Городское управление и контроль» и <b>начни там потребление любого ресурса</b>, поставив галочку напротив и подтвердив свое решение.'
    },// = Потребление ресурсов	
	38: {
        giver: Quest.givers.iface,
        name: 'Узнай характеристику здания',
        text: 'Масса полезной информации хранится в энциклопедии. Не пренебрегай изучением столь важного источника информации. <br><img src="https://test.waysofhistory.com/img/buildings2/4_1.png" style="float:left; margin:5px">Перейди в Энциклопедию и скажи мне, <b>насколько эффективен Колодец</b> на максимальном, 20-ом уровне развития. Его ты сможешь найти в разделе «Строения», среди демографических зданий...<br>{{?!it.quest.isStatusBonus()}}<span class="qinf-text-block"><form class="qinf-form"><span class="qinf-form-alert -hidden"><span class="iconCancel"></span>неверный ответ</span>{{=snip.input1({name: "questdata"})}}<button type="submit" class="button1">Ответить</button></form></span>{{?}}'
    },// = Узнать характеристику здания	
	39: {
        giver: Quest.givers.build,
        name: 'Разрушь лишнее строение',
        text: 'Не все здания сохраняют свою актуальность продолжительное время. Быть может пришло время разрушить такое строение, дабы освободить место под что-то более полезное. <b>Разрушь любое здание</b>.'
    },// = Разрушить лишнее строение	
	40: {
        giver: Quest.givers.build,
        name: 'Построй колодец 3 уровня',
        text: 'Учитывай что прирост населения можно увеличить постройкой разных демографических зданий. Одно из них - колодец. <b>Вырой его прямо сейчас, а после улучши аж до третьего уровня</b>.<br><span class="qinf-text-block -hideMob">{{=snip.emptySlot()}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(4, 3)}}</span>'
    },// = Колодец 3 уровня	
	41: {
        giver: Quest.givers.build,
        name: 'Улучши колодец до 6 уровня',
        text: 'Потрясающий эффект! <b>Улучши колодец до 6 уровня</b>.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(4, 3)}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(4, 6)}}</span>'
    },// = Колодец 6 уровня	
	42: {
        giver: Quest.givers.iface,
        name: 'Взгляни на карту',
        text: 'Мир простирается за пределы твоего города. Он полон чудес и открытий. Сперва тебе будет доступна к обзору только ближайшая к городу местность. Остальное будет скрыто таинственным туманом. <br>Но уже сейчас ты можешь понять в какие края закинула судьба. <br>Пришло время.<br><span class="qinf-mmenuBtn -type-map"></span><br><b>Перейди к карте и осмотрись</b>. После возвращайся ко мне.'
    },// = Взглянуть на карту	
	43: {
        giver: Quest.givers.iface,
        name: 'Переименуй город',
        text: 'Совсем скоро твое поселение станет настоящим Городом. О нем наверняка узнают все обитатели этого чудного мира. Ну, или хотя бы ближайшие соседи. И как же они будут говорить о твоем городе? «Это тот, который там?...». Нет! Первый город твоей будущей империи должна иметь название. Громкое, интересное и красивое. Такое, что будет вызывать уважение. А в некоторых случаях, возможно, даже вселять страх. <br>Чтобы переименовать город, нажми на карандашик <span class="qinf-text-pencil -active"></span> около имени города. В появившемся поле введи новое имя. <b>Подумай о названии своего поселения и установи его</b>.'
    },// = Переименовать город	
	44: {
        giver: Quest.givers.iface,
        name: 'Выбери науку',
        text: 'А теперь подумай, чему бы ты хотел научить своих людей? <div style="text-align: justify"><b>{{=snip.scienceImgNameLink(0)}}</b> даст твоим горожанам тепло. Они смогут готовить еду и отпугивать диких зверей. Выбери огонь, и ты пойдешь по пути роста племени. <br><br><b>{{=snip.scienceImgNameLink(2)}}</b> позволят легче строить здания и добывать ресурсы. Выбери орудия труда, чтобы пойти по промышленному пути. <br><br><b>{{=snip.scienceImgNameLink(4)}}</b> научит мужчин твоего племени воевать! Они будут убивать диких животных и грабить врагов. Выбери охоту, чтобы пойти по военному пути. <br><br><b>{{=snip.scienceImgNameLink(15)}}</b> даст горожанам возможность общаться друг с другом. Мудрецы смогут рассказывать друг другу о своих идеях и наблюдениях. Выбери речь, и ты пойдешь по научному пути. <br><br><b>{{=snip.scienceImgNameLink(151)}}</b> - позволяет усилить твою независимость от внешних факторов. Какой путь твой? </div><b>Выбери науку для изучения прямо сейчас</b>. Для этого нужно щелкнуть по кнопке <span class="qinf-mmenuBtn -type-science"></span> и сделать свой выбор.'
    },// = Выбор науки	
	45: {
        giver: Quest.givers.science,
        name: 'Изучи первую науку',
        text: 'Познание наук и технологий очень важный процесс для дальновидного правителя. Чтобы изучить науку необходимо вложить в ее изучение {{=snip.res(0)}}знания. Получить их можно, например, выполняя мои задания. Также они добываются как и обычные ресурсы, но только в строениях предназначенных для научных изысканий. Подробнее об этом я расскажу тебе позже.<br/> А пока <b>выучи свою первую науку</b>'
    },// = Изучить 1 науку	
	46: {
        giver: Quest.givers.science,
        name: 'Изучи вторую науку',
        text: 'Изучение наук дает тебе новые возможности, новые войска и здания. <br>А теперь я расскажу тебе как «производятся» {{=snip.res(0)}}знания. Как я уже говорил, добываются они как и обычные ресурсы, но только в строениях предназначенных для научных изысканий.<br/>После того как ты распределишь своих жителей на научные рабочие места, в городе начнут вырабатываться {{=snip.res(0)}}знания. А они, в свою очередь, помогут изучить текущую науку. Но помни, что распределение твоих жителей должно быть оптимальным.<br/>Хорошим примером научного здания является {{=snip.slotFrame2(new Slot(88,1))}}{{=snip.buildLink(new Slot(88,1))}}. Даже если ты еще не научился его строить, не откладывай это в долгий ящик.<br/>Как только появится возможность, не трать времени на раздумья и <b>изучи выбранную науку</b>.'
    },// = Изучить 2 науки	
	47: {
        giver: Quest.givers.science,
        name: 'Изучи третью науку',
        text: 'Никогда не останавливайся на тернистом пути поиска знаний. Хватит киснуть в дикости. Познание наук дает тебе новые возможности, новые войска и здания. <b>Изучи еще одну любую науку</b>. Обрати внимание на награду. И ты поймешь, что не только материальные богатства важны в этом мире...'
    },// = Изучить 3 науки	
	48: {
        giver: Quest.givers.science,
        name: 'Четвертая и пятая науки',
        text: 'Каждая новая наука приближает тебя к могуществу. Внимательно выбирай свой путь в этом мире. <b>Изучи еще две любые науки</b>. Обрати внимание на награду. И ты поймешь, что не только материальные богатства важны в этом мире...'
    },// = Изучить 5 наук	
	49: {
        giver: Quest.givers.science,
        name: 'Изучи 10 наук',
        text: 'Я хочу убедиться, что ты правильно понимаешь мои советы. Докажи делом, что ты не один из тех многочисленных твердолобых. Тех самых, кто не в состоянии выучить даже имя собственного правителя. <b>Изучи еще пять наук</b>.'
    },// = Изучить 10 наук	
	50: {
        giver: Quest.givers.science,
        name: 'Изучи 15 наук',
        text: 'О! Я не обманулся в тебе. Ты действительно целеустремлен. Теперь ты проникся всей важностью научных исследований. <b>Изучи еще пять любых наук</b>.'
    },// = Изучить 15 наук	
	51: {
        giver: Quest.givers.science,
        name: 'Изучи 20 наук',
        text: 'Не вижу смысла мотивировать тебя далее на пути изучения наук. Ты и сам все прекрасно понял. <b>Изучи еще пять любых наук</b>.'
    },// = Изучить 20 наук	
	52: {
        giver: Quest.givers.trade,
        name: 'Построй площадь',
        text: 'Ты ведь помнишь, что в этом мире не одинок. Правильно строй отношения с соседями. Ведь именно с ними тебе предстоит создать сильное государство и привести его к победе! <br>Одним из важнейших аспектов вашего взаимодействия являются торговые отношения. <br>Для начала <b>построй площадь</b> на месте любой зеленой таблички. <br>Но помни, что возможно сначала тебе нужно изучить науку, которая даст возможность её построить.<br><span class="qinf-text-block -hideMob">{{=snip.emptySlot()}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(87, 1)}}</span>'
    },// = Площадь	
	53: {
        giver: Quest.givers.trade,
        name: 'Купи что-нибудь на площади',
        text: 'Теперь, когда площадь построена, твои торговцы могут обмениваться ресурсами с соседями. <b>Зайди на площадь и выменяй там что-нибудь</b> бесполезное на необходимое.'
    },// = Купить на рынке	
	54: {
        giver: Quest.givers.trade,
        name: 'Создай торговое предложение',
        text: 'Торговые отношения очень важны. И порой они крепче иных союзов. Ты еще новичок на этом поприще. Давай я помогу сделать тебе первый шаг. <br><b>Создай свое первое торговое предложение</b> на площади. Для этого перейди к «торговле», а там к «созданию предложения» и выставь свое предложение.<br>'
    },// = Свое предложение на рынке	
	55: {
        giver: Quest.givers.trade,
        name: 'Купи и продай по 1000 ресурсов',
        text: 'Всегда чего-то не хватает. Жизнь ставит перед нами различные задачи. Но, зачастую, не всегда хватает всех ресурсов на их решение. Но, быть может, у твоих соседей есть переизбыток таких необходимых тебе полезностей. Просто <b>купи и продай на рыночной площади по 1000 любых ресурсов</b>.'
    },// = Купить и продать на рынке 1к ресурсов	
	56: {
        giver: Quest.givers.trade,
        name: 'Купи и продай по 2500 ресурсов',
        text: 'Продолжай в том же ключе. <b>Купи и продай на рыночной площади по 2500 любых ресурсов</b>.'
    },// = Купить и продать на рынке 2.5к ресурсов	
	57: {
        giver: Quest.givers.trade,
        name: 'Купи и продай по 5000 ресурсов',
        text: 'Так просто войти во вкус. Обменять то, что у тебя вываливается из переполненной землянки, на дефицитные или редкие ресурсы — естественное желание. Помни, что твои соседи жаждут того же. <b>Купи и продай по 5000 любых ресурсов</b>.'
    },// = Купить и продать на рынке 5000 ресурсов	
	58: {
        giver: Quest.givers.trade,
        name: 'Купи и продай по 10000 ресурсов',
        text: 'Ничто не должно смущать тебя в деле меновой торговли. <b>Купи и продай по 10000 любых ресурсов</b>.'
    },// = Купить и продать на рынке 10000 ресурсов	
	59: {
        giver: Quest.givers.trade,
        name: 'Купи и продай по 25000 ресурсов',
        text: 'Ты уже опытный купец. Не мне тебя учить, что нужно делать на рынке. Может быть, стоит попробовать поискать постоянных торговых партнеров. Или новые рынки сбыта. Впрочем, решать тебе. <b>Купи и продай по 25000 ресурсов</b>.'
    },// = Купить и продать на рынке 25000 ресурсов	
	60: {
        giver: Quest.givers.trade,
        name: 'Купи и продай по 50000 ресурсов',
        text: 'Торговые союзы. Купеческие маршруты. Новые ресурсы и редкие товары. Что может быть более захватывающе и еще интереснее? Разнообразна жизнь негоцианта. <b>Купи и продай по 50000 ресурсов</b>.'
    },// = Купить и продать на рынке 50000 ресурсов	
	61: {
        giver: Quest.givers.trade,
        name: 'Ускорь доставку товара',
        text: 'Привлеки немного удачи к делу моментальной доставки важных товаров. Не нужно более ждать. Убивать бесконечные часы в ожидании доставки столь необходимого. <b>Ускорь три доставки товара</b> за символическую плату в {{=snip.luck()}}Монетах Удачи щелкнув по уже знакомой кнопке возле торговцев, находящихся в пути.'
    },// = Ускорить торговца	
	62: {
        giver: Quest.givers.iface,
        name: 'Прочитай напутственное письмо',
        text: 'Тебе будут приходить письма от других правителей, а также от Демиургов. Я думаю не стоит объяснять всю важность этой возможности. <br>При получении новых писем ты увидишь мерцающий конверт на красном фоне. <br><span class="qinf-mmenuBtn -type-message"></span><br><b></b>Прочти сейчас напутственное письмо'
    },// = Прочитать письмо	
	63: {
        giver: Quest.givers.iface,
        name: 'Создай комментарий на карте',
        text: 'Оказывается, наше поселение не единственное в этом мире! Пора заявить о себе. <br><span class="qinf-mmenuBtn -type-map"></span><br>Перейди к карте мира, выбери любую клетку и <b>оставь на ней свой комментарий</b>. <br>Пусть соседи узнают о тебе и твоем племени. И знай, что вокруг места, которое ты почтишь своим сообщением развеется туман войны.'
    },// = Объявление на карте	
	64: {
        giver: Quest.givers.viral,
        name: 'Плюсы дружбы',
        text: 'Игра с друзьями это всегда весело и интересно. К тому же, если твой друг зарегистрируется по твоей реферальной ссылке и сумеет выполнить все задания отшельника, это принесет тебе дополнительные {{=snip.luck()}}Монеты Удачи. <br>Зайди во вкладку Удача и посмотри, <b>сколько именно {{=snip.luck()}}Монет Удачи ты сможешь получить? </b><br>Напиши здесь правильный ответ.{{?!it.quest.isStatusBonus()}}<span class="qinf-text-block"><form class="qinf-form"><span class="qinf-form-alert -hidden"><span class="iconCancel"></span>неверный ответ</span>{{=snip.input1({name: "questdata"})}}<button type="submit" class="button1">Ответить</button></form></span>{{?}}'
    },// = Вопрос цены реферала	
	65: {
        giver: Quest.givers.iface,
        name: 'Выбери бонус за Монеты Удачи',
        text: 'В этом мире многое зависит не только от тебя, но и от сопутствующей Удачи. Мерилом ее являются {{=snip.luck()}}Монеты Удачи. <br>С ними разумному правителю всегда будет легче и быстрее решать как насущные проблемы, так и воплощать в жизнь амбициозные и масштабные проекты. <br>Видя с каким рвением ты относишься к развитию своего города, я решил подарить тебе немного {{=snip.luck()}}Монет Удачи. <br>Зайди <b>в меню удачи и сделай мудрый выбор</b> среди многочисленных возможностей.'
    },// = Купить бонус за МУ	
	66: {
        giver: Quest.givers.viral,
        name: 'Пригласи друга',
        text: 'Твой взгляд кажется мне одиноким и потерянным. А ты <b>пригласи в игру друга, используя свою реферальную ссылку</b> со страницы Удачи: <br>{{=tmplMgr.snipet.clipboard({tag: snip.referalLink(), brackets: false, btnText: "Скопировать в буфер обмена"})}} <br>И когда он начнет играть, жизнь твоя гораздо упростится. <br/><b>Пригласи друга и убедись что он начал играть на странице Удачи в списке «<a class="link" href="'+HashMgr.getHref('#/bonusReferals')+'">зарегистрировавшихся рефералов</a>»</b>.',
        referal: true,
    },// = Пригласить 1 реферала	
	67: {
        giver: Quest.givers.viral,
        name: 'Пригласи 2 друзей',
        text: '&quot;Когда знаешь что на подхвате уже будет не один и даже не полтора, а целых два полновесных товарища, походка твоя обретает твердость и уверенность, а плечи расправляются. <b>Пригласи в игру двух друзей, используя свою реферальную ссылку</b> со страницы Удачи: <br>{{=tmplMgr.snipet.clipboard({tag: snip.referalLink(), brackets: false, btnText: "Скопировать в буфер обмена"})}}. <br><b>Пригласи друзей и убедись что они начали играть. Увидеть ты это сможешь в любой момент на странице Удачи в списке «<a class="link" href="'+HashMgr.getHref('#/bonusReferals')+'">зарегистрировавшихся рефералов</a>»</b>.',
        referal: true,
    },// = Пригласить 2 рефералов	
	68: {
        giver: Quest.givers.viral,
        name: 'Пригласи 5 друзей',
        text: 'Надо увеличивать шансы на победу каждый день. Пригласи в игру пятерых друзей, используя свою реферальную ссылку со страницы Удачи: <br>{{=tmplMgr.snipet.clipboard({tag: snip.referalLink(), brackets: false, btnText: "Скопировать в буфер обмена"})}}<br><br> Это же проверенный и славный способ. <br><b>Пригласи друзей и убедись что они начали играть. Увидеть ты это сможешь в любой момент на странице Удачи в списке «<a class="link" href="'+HashMgr.getHref('#/bonusReferals')+'">зарегистрировавшихся рефералов</a>»</b>.',
        referal: true,
    },// = Пригласить 5 рефералов	
	69: {
        giver: Quest.givers.viral,
        name: 'Пригласи 10 друзей',
        text: '10 верных друзей - огромная сила. Не стоит пренебрегать такими возможностями. <b>Пригласи в игру десять друзей, используя свою реферальную ссылку</b> со страницы Удачи: <br>{{=tmplMgr.snipet.clipboard({tag: snip.referalLink(), brackets: false, btnText: "Скопировать в буфер обмена"})}}. <br><b>Пригласи друзей и убедись что они начали играть. Увидеть ты это сможешь в любой момент на странице Удачи в списке «<a class="link" href="'+HashMgr.getHref('#/bonusReferals')+'">зарегистрировавшихся рефералов</a>»</b>.',
        referal: true,
    },// = Пригласить 10 рефералов	
	70: {
        giver: Quest.givers.science,
        name: 'Озвучь стоимость математики',
        text: 'Энциклопедия является ценнейшим источником знаний. Из нее ты сможешь получить ответы на практически любые важные вопросы. Для начала, попробуй узнать, сколько знаний потребуется на изучение науки {{=snip.scienceImg(18)}} Математика. <br>Найди Математику в списке наук и изобретений в энциклопедии и <b>введи в окошко ее стоимость</b>.<br>{{?!it.quest.isStatusBonus()}}<span class="qinf-text-block"><form class="qinf-form"><span class="qinf-form-alert -hidden"><span class="iconCancel"></span>неверный ответ</span>{{=snip.input1({name: "questdata"})}}<button type="submit" class="button1">Ответить</button></form></span>{{?}}'
    },// = Стоимость математики	
	71: {
        giver: Quest.givers.viral,
        name: 'Мироустройство',
        text: 'Я открою тебе две страшные тайны. <br>'+
            'Во-первых, наш мир плоский и покоится на спине огромной спящей Черепахи-Матери. Ее стоит почитать. <br>'+
            'Во-вторых этот мир не первый! Множество цивилизаций существовало и ранее. А какие-то живы и поныне. И тоже покоятся на спине своей Черепахи-Матери. И дрейфуют эти Черепахи в водах Великой Реки Времени. Но иногда Черепаха просыпается. Стряхивает со своего панциря земли, людей, города и уходит в пучину, чтобы зародить там новый мир. Но происходит это, на наше счастье очень редко. <br>'+
            'Зная твой пытливый ум я хочу попросить узнать кое что для меня. Меня мучает вопрос: «<b>Когда же появилась первая жизнь во вселенной Путей Истории</b>?» <br>'+
            'Правильный ответ ты можешь {{?Ability.forum()}}найти <a class="link" href="{{=lib.main.community[wofh.platform.id]}}" target="_blank"><span class="smenuIcon -type-frm"></span>в сообществе</a>, либо {{?}}спросить у соседей, вдруг они и были теми самыми первопроходцами.'+
            '{{?!it.quest.isStatusBonus()}}<span class="qinf-text-block"><form class="qinf-form"><span class="qinf-form-alert -hidden"><span class="iconCancel"></span>неверный ответ</span><select name="day" class="select1"><option>число</option>{{for(i=1;i<=31;i++){}}<option value="{{=i}}">{{=i}}</option>{{}}}</select><select name="month" class="select1"><option>месяц</option><option value="1">Январь</option><option value="2">Февраль</option><option value="3">Март</option><option value="4">Апрель</option><option value="5">Май</option><option value="6">Июнь</option><option value="7">Июль</option><option value="8">Август</option><option value="9">Сентябрь</option><option value="10">Октябрь</option><option value="11">Ноябрь</option><option value="12">Декабрь</option></select><button type="submit" class="button1">Ответить</button></form></span>{{?}}'
    },// = 01.09.2009	
	72: {
        giver: Quest.givers.iface,
        name: 'Опиши себя',
        text: 'Твое влияние в округе растет на глазах. Пришло время объяснить всем кто ты и что ты ждешь от мира или готов дать ему. <br>Просто зайди в {{=snip.icon(snip.c.smenu, \'opt\', false, \'настройки\')}} и <b>напиши несколько слов</b> о себе и своем мировоззрении. И возможно именно этот простой шаг подарит тебе новых друзей.'
    },// = Указать мыло и описание акка	
	73: {
        giver: Quest.givers.build,
        name: 'Колонизируй месторождение',
        //text: 'Этот мир наполнен разнообразнейшими <b>ресурсами</b>. Но, для того чтобы иметь возможность добывать их, необходимо колонизировать нужное '
        text: 'Этот мир наполнен разнообразнейшими <a class="link" href="'+HashMgr.getHref('#/help/res')+'">ресурсами</a>. Но, для того чтобы иметь возможность добывать их, необходимо колонизировать нужное <a class="link" href="'+HashMgr.getHref('#/help/deposit')+'">месторождение</a> рядом с городом при помощи крепких рук твоих {{=snip.unitNameLink(Unit.ids.worker, \'Рабочих\')}}. Но прежде чем обучить их убедись в наличии доступного месторождения рядом с городом. Очень уж рабочие прожорливы. <b>И колонизируй одно из месторождений по возможности.</b> И помни о том, что нельзя захватить Неизвестное месторождение. А новые месторождения будут тебе открываться по мере изучения наук. Подробнее ты можешь прочитать про это в {{=snip.nobr(\'<span class="iconPedia"></span>Энциклопедии\')}}.'
    },// = Колонизировать месторождение	
	74: {
        giver: Quest.givers.build,
        name: 'Построй второй город',
        text: 'Ты ведь собирался организовать могучую империю, а для этого явно недостаточно одного города. Тебе необходимо зайти в алтарь и дать задание — обучать Поселенцев (обучение каждого длится какое-то время и требует изученной науки). Когда все приготовления закончатся, ты сможешь отправить Поселенцев для основания нового города, указав место на карте. <br>Когда будешь готов — выбери место и <b>построй второй город</b>.'
    },// = Второй город	
	75: {
        giver: Quest.givers.build,
        name: 'Построй третий город',
        text: 'Ты теперь опытный градостроитель. Пришло понимание в обустройстве и удовлетворении потребностей. Ты точно знаешь, что тебе нужно и куда стоит стремиться. Быть может пора уже <b>основать третий город</b>?'
    },// = Третий город	
	76: {
        giver: Quest.givers.build,
        name: 'Создай улучшение местности',
        text: 'Если ты обратишься к карте, то сможешь заметить что можно переключиться в режим строительства.<button class="btnMapMode -type-build" title="Строительство дорог и улучшений"></button><br> По мере изучения наук там тебе будут доступны все новые всевозможнейшие улучшения и постройки на местности. Там же доступна и прокладка дорог. Дороги-дороги. Н-да... Дороги, знаешь они такие...э.. дороги.. Дороги это такое дело... Ну вообщем давай не будем путать улучшения местности с дорогами. Дороги знаешь ли...совсем другая история..<br> Подробную информацию ты всегда сможешь найти в <a class="link" href="'+HashMgr.getHref('#/help')+'">{{=snip.icon(snip.c.smenu, "hlp")}}энциклопедии</a>. А сейчас построй любое улучшение. Но не дороги. Дороги это все не то... '
    },// = Улучшение местности	
	77: {
        giver: Quest.givers.build,
        name: 'Проложи дорогу',
        text: 'Правильно проложенные дороги не только ускоряют перемещение войск по местности, но и ускоряют процесс торговли. Изучая новые науки, ты через какое-то время получишь возможность не только строить новые дороги, но и улучшать существующие. Проложи дорогу.'
    },// = Дорога	
	78: {
        giver: Quest.givers.viral,
        name: 'Создай или вступи в страну',
        text: '{{var bld = new Slot(13, 1).getAlternate();}}В одиночку трудно противостоять врагам, как бы развит ты не был. В единомышленниках сила! Попробуй найти страну со схожими интересами и <b>вступи в нее, либо создай свою и пригласи в нее соседей</b>. <br>Для того, чтобы создать страну тебе потребуется {{=snip.slotFrame2(bld)}}{{=snip.buildLink(bld, false, {level: false})}}. Более подробно об объединении ты всегда сможешь узнать из энциклопедии.'
    },// = Страна	
	79: {
        giver: Quest.givers.viral,
        name: '3 человека в твоей стране',
        text: 'Сложно с серьезным лицом называть объединение двух человек страной. Чем дольше ты пребываешь в этом мире, тем явственней чувствуется потребность в крепком и надежном плече. И чем больше этих плечей, тем уверенней ты себя начнешь ощущать. Продолжай искать единомышленников. <b>Объединись в страну с тремя людьми</b>.'
    },// = 3 человека в стране	
	80: {
        giver: Quest.givers.viral,
        name: '5 человек в твоей стране',
        text: 'Продолжай находить сподвижников. В больших странах жизнь гораздо интереснее и разнообразнее. <b>Объединись в страну с пятью единомышленниками</b>.'
    },// = 5 человек в стране 	
	81: {
        giver: Quest.givers.viral,
        name: '10 человек в твоей стране',
        text: 'Страны всегда сильнее одиночек. Но нельзя забывать о необходимости наличия сильного лидера. В твоей стране должно быть 10 человек.'
    },// = 10 человек в стране	
	82: {
        giver: Quest.givers.science,
        name: 'Построй петроглиф',
        text: 'Тебе стало доступно новое строение: петроглиф. Это здание строится на холме, на месте обозначенном серой табличкой. Сейчас я подсвечу ее для тебя голубым цветом.<br>Петроглиф даёт возможность для добычи {{=snip.res(0)}}знаний в городе, предоставляя научные рабочие места. <b>Построй Петроглиф</b> и ты сможешь направить своих работников в научное производство.<br><span class="qinf-text-block -hideMob">{{=snip.emptySlot({terrain: Build.slotType.mountain, blink: true})}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(new Slot(88, 1, Slot.location.hill), undefined, {useDNewWnd: true})}}</span>',
        blinkBuilds: [88],
    },// = Петроглиф 1 уровня	
	83: {
        giver: Quest.givers.science,
        name: 'Улучши петроглиф до 2 уровня',
        text: 'Ты хорошо начал. Не думай, что просто построить петроглиф, значит уже стать великим ученым. Для повышения эффективности зданий их необходимо совершенствовать, давая этим новые рабочие места в научной сфере. А теперь <b>улучши петроглиф до второго уровня</b> и посмотри на результат зайдя в распределение населения города.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(new Slot(88, 1, Slot.location.hill), undefined, {useDNewWnd: true})}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(new Slot(88, 2, Slot.location.hill), undefined, {useDNewWnd: true})}}</span>',
        blinkBuilds: [88],
    },// = Петроглиф 2 уровня	
	84: {
        giver: Quest.givers.science,
        name: 'Улучши петроглиф до 4 уровня',
        text: 'Ну раз уж так хорошо пошло, давай не будем останавливаться. Давай <b>улучшим петроглиф еще на 2 уровня</b>.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(new Slot(88, 2, Slot.location.hill), undefined, {useDNewWnd: true})}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(new Slot(88, 4, Slot.location.hill), undefined, {useDNewWnd: true})}}</span>',
        blinkBuilds: [88],
    },// = Петроглиф 4 уровня	
	85: {
        giver: Quest.givers.science,
        name: 'Улучши петроглиф до 7 уровня',
        text: 'Вложенные в развитие ресурсы всегда возвращаются сторицей. Не стоит сомневаться. Стоит <b>улучшить твой петроглиф до седьмого уровня</b>.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(new Slot(88, 7, Slot.location.hill))}}</span>'
    },// = Петроглиф 7 уровня	
	86: {
        giver: Quest.givers.science,
        name: 'Улучши петроглиф до 12 уровня',
        text: 'Всегда помни о том, что потребности твоих жителей зачастую пугающе разнообразны. И не ограничиваются только научными изысканиями... Ну а пока <b>улучши петроглиф до 12 уровня</b>.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(new Slot(88, 12, Slot.location.hill))}}</span>'
    },// = Петроглиф 12 уровня	
	87: {
        giver: Quest.givers.war,
        name: 'Отбей атаку варваров',
        text: 'Здравствуй, путник. Да, да, я знаю. Ты рад. Да ты готов предложить свою хижину, если мне будет угодно.... Да, да... я все понимаю. Но сейчас не ко времени!  К твоему городу приближается орда враждебно настроенных варваров. Этот мир суров. Благо твои отважные воины готовы дать отпор нежданному врагу. Я буду рядом и помогу тебе, если будет нужно. <br>А сейчас морально подготовься и <b>отбей атаку варваров</b>. Правда, твои воины достаточно суровы и справятся с задачей сами. Но ты как новичок в военном деле можешь отважно понаблюдать за битвой с вершины ближайшего холма.'
    },// = Атака варваров
	88: {
        giver: Quest.givers.war,
        name: 'Атакуй варваров',
        text: 'Возмездие должно быть неотвратимым и, по-возможности, молниеносным. Пришло время пролить кровь этих негодяев, посмевших напасть на нашу замечательную деревню! <br><br><span class="qinf-mmenuBtn -type-map"></span><br>Перейди к карте. <b>Найди там ближайший лагерь варваров и атакуй его всеми своими войсками</b>. Не щади никого. <br>Возвращайся после ко мне и я нанесу на твою карту местность вокруг места твоего боя.'
    },
	89: {
        giver: Quest.givers.war,
        name: 'Бойцовская яма',
        text: 'Твои войска не берутся из воздуха. Для того чтобы располагать армией ее нужно обучить. Бойцовская яма позволяет обучить жителей твоего города, превратив их в грозных представителей войск каменного века. <b>Построй бойцовскую яму</b> в любом доступном месте города.<br><span class="qinf-text-block -hideMob">{{=snip.emptySlot()}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(1, 1)}}</span>'
    },// = Бойцовская яма 1 уровня	
	90: {
        giver: Quest.givers.war,
        name: 'Бойцовская яма 2 уровень',
        text: 'Чем лучше обустроена твоя яма, тем быстрее обучаются в ней войска. <b>Улучши бойцовскую яму до 2 уровня</b><br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(1, 1)}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(1, 2)}}</span>'
    },// = Бойцовская яма 2 уровня	
	91: {
        giver: Quest.givers.war,
        name: 'Сколько древесины стоит 1 дубинщик?',
        text: 'Вся важная информация о войсках хранится в «Энциклопедии». Зайди туда в раздел «Войска» и скажи мне... эээ... а сколько {{=snip.res(Resource.ids.wood)}}древесины нужно потратить, дабы обучить {{=snip.unitCountLink(new Unit(12).getAlternate(), 1)}} дубинщика?{{?!it.quest.isStatusBonus()}}<br><span class="qinf-text-block"><form class="qinf-form"><span class="qinf-form-alert -hidden"><span class="iconCancel"></span>неверный ответ</span>{{=snip.input1({name: "questdata"})}}<button type="submit" class="button1">Ответить</button></form></span>{{?}}'
    },// = Узнать про юнита	
	92: {
        giver: Quest.givers.war,
        name: 'Симулятор боя',
        text: 'Замечательно когда можно заранее проверить свои военные догадки на практике, не боясь потерять своих верных воинов. <br><b>Открой «Симулятор боя» и проведи пробный бой</b>.'
    },// = Просимулировать бой
	93: {
        giver: Quest.givers.war,
        name: 'Обучи воинов',
        text: 'Ты выбрал военный путь развития, и твоя бойцовская яма уже пригодна для обучения военному делу пока еще неуклюжих людишек. <br>Убедись что ты изучил науку позволяющую тебе обучать воинов, например Охоту. И тогда точно пришло время создавать первую, но явно не последнюю армию. <br><b>Обучи своих первых {{=snip.unitCountLink(new Unit(0).getAlternate(), lib.quest.trainunits)}} воинов</b>.'
    },
	94: {
        giver: Quest.givers.war,
        name: 'Отправь войска в атаку',
        text: 'Покажи свое истинное лицо — лицо настоящего воина. <b>Отправь войска в атаку на любую цель</b>. Постарайся выжить... Ты мне начинаешь...кхм...Возвращайся скорее, и желательно, целым.'
    },
	95: {
        giver: Quest.givers.war,
        name: 'Бойцовская яма 4 уровень',
        text: 'Ты хорошо начал. Не думай, что просто построить бойцовскую яму, значит уже стать великим воителем. Для повышения эффективности зданий их необходимо совершенствовать. А теперь <b>улучши бойцовскую яму до четвертого уровня</b> и посмотри, насколько быстрее будут обучаться в ней войска.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(1, 3)}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(1, 4)}}</span>'
    },// = Бойцовская яма 4 уровня	
	96: {
        giver: Quest.givers.war,
        name: 'Бойцовская яма 7 уровень',
        text: '<b>Улучши бойцовскую яму до 7 уровня</b>. Это будет правильно. Это будет своевременно.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(1, 4)}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(1, 7)}}</span>'
    },// = Бойцовская яма 7 уровня	
	97: {
        giver: Quest.givers.war,
        name: 'Обучи дубинщиков',
        text: 'Все войска различаются между собой. Необходимо грамотно составлять свои боевые отряды. <br><b>Сейчас обучи  {{=snip.unitCountLink(new Unit(12).getAlternate(), lib.quest.trainunits)}} дубинщиков.</b> Это свирепые и сильные воины.'
    },
	98: {
        giver: Quest.givers.war,
        name: 'Обучи {{?!wofh.account.race.is(Race.ids.india)}}пращников{{??}}метателей дротиков{{?}}',
        text: 'Очень важной составляющей любой армии является группа обстрела. <b>Обучи {{=snip.unitCountLink(new Unit(1).getAlternate(), lib.quest.trainunits)}} {{?!wofh.account.race.is(Race.ids.india)}}пращников{{??}}метателей дротиков{{?}}</b>. Эти ловкие юноши будут замечательным подспорьем в любом бою.'
    },
	99: {
        giver: Quest.givers.war,
        name: 'Атаки на варваров',
        text: 'Жестокие времена требуют жестоких решений. Пора зачистить местность от опасных в своей дикости варваров. <br><b>Соверши 5 атак на варварские лагеря</b>.'
    },
	100: {
        giver: Quest.givers.war,
        name: 'Соверши 10 атак',
        text: 'Может хватит тиранить только беззащитных варваров? Пора потрогать за мягкое подбрюшье и своих сладких соседей. <b>Соверши 10 атак на всех подряд</b>. '
    },
	101: {
        giver: Quest.givers.war,
        name: 'Ограбь другого игрока',
        text: 'Не хотелось бы поощрять твою кровожадность... Но в этом суровом мире выживают лишь сильные люди. <b>Ограбь соседа</b> дабы не оставлять заблуждений по поводу твоей мягкопушистости.'
    },
	102: {
        giver: Quest.givers.iface,
        name: 'Прочитай отчет',
        text: 'Все важные события, в том числе военные и торговые операции найдут свое отображение в отчетах. <br><span class="qinf-mmenuBtn -type-report"></span><br>Ты в любой момент можешь перейти к списку всех своих отчетов. <br>Когда появляется свежий отчет кнопка загорается красным светом. <b>Открой и внимательно изучи любой из отчетов</b> прямо сейчас.'
    },// = Прочитать отчет	
	103: {
        giver: Quest.givers.war,
        name: 'Построй тайник',
        text: 'Первые дни твой город защищен от врагов. Но по прошествии времени твои жители не застрахованы и от нападений агрессивных соседей. Вражеским войскам нужны твои ресурсы. Защитить их ты сможешь тремя способами: <br><b>Создать гарнизон своих собственных войск.</b> Сейчас это очень затратный и сложный способ. <br><b>Выкопать ров</b>. И тогда враги, нападая на твой город, будут нести потери. Так ты сможешь раз и навсегда отучить их приходить без приглашения. <br><b>Построить тайник</b> - самый дешевый способ. Туда будет спрятано часть наших ресурсов во время набега врага. <br><br>Так же ты можешь с успехом совмещать любые из них. <br>А сейчас <b>построй тайник</b>. Стоит он недорого, но в случае нападения польза будет очевидна.<br><span class="qinf-text-block -hideMob">{{=snip.emptySlot()}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(86, 1)}}</span>'
    },// = Тайник	
	104: {
        giver: Quest.givers.war,
        name: 'Улучши тайник до 2 уровня',
        text: 'А тайник-то твой мелковат и простоват. <br>Не спрятать в нем действительно внушительные запасы. <br>Продолжай развивать его. Помни, все что не поместится в тайник может быть разграблено при нападении на твой город. <br><b>Улучши тайник до 2 уровня</b>.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(86, 1)}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(86, 2)}}</span>'
    },// = Тайник 2 уровня	
	105: {
        giver: Quest.givers.war,
        name: 'Улучши тайник до 5 уровня',
        text: 'Тайник это очень простой инструмент пассивной защиты. При внезапном нападении супостата на твою деревню именно спрятанные в надежный тайник ресурсы спасут тебя от полного разграбления. <br>А теперь <b>улучши тайник до пятого уровня</b>.<br><span class="qinf-text-block -hideMob">{{=snip.slotImgLevelBigLink(86, 2)}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(86, 5)}}</span>'
    },// = Тайник 5 уровня	
	106: {
        giver: Quest.givers.build,
        name: 'Ускорь строительство',
        text: 'Бывает что нет сил ждать. А эти вялые бездельники, твои строители, двигаются подобно сонным мухам. Как же мучительно долго возводятся эти здания в то время когда они отчаянно нужны. <br>Небольшая кнопка <a title="" class="immediate btns bt_tb" style="float: none;display: inline-block;"></a> заставит ваших строителей начать двигаться с нечеловеческой скоростью и моментально закончить текущее строительство. Причем, за достаточно символическое количество {{=snip.luck()}}Монет Удачи. <br>Для того чтобы убедиться в абсолютной полезности этой возможности <b>соверши ускорение строительства 3 раза</b>.'
    },// = Ускорить строительство	
	107: {
        giver: Quest.givers.war,
        name: 'Вырой ров',
        //нормальный вариант
        //text: 'Ваши дозорные заметили воинствующие племена неподалеку. Видимо, пришло время укрепить оборону. <br>Фортификационные сооружения строятся в специальном месте, обозначенном красными табличками. <b>Выкопай ров вокруг своего города</b> как только у тебя появится такая возможность.<span class="qinf-text-block -hideMob">{{=snip.emptySlot(4)}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(3, 1)}}</span>'
        //вариант с 13м сегментом, который будет использоваться здесь и только здесь %)
        text: 'Ваши дозорные заметили воинствующие племена неподалеку. Видимо, пришло время укрепить оборону. <br>Фортификационные сооружения строятся в специальном месте, обозначенном красными табличками. <b>Выкопай ров вокруг своего города</b> как только у тебя появится такая возможность.<span class="qinf-text-block -hideMob">{{=snip.emptySlot({terrain: Build.slotType.perimetr})}}{{=snip.slotArrow()}}{{slot = new Slot(3,1);}}<span class="-nobr"><a class="link" href="'+HashMgr.getHref('#/buildinfo/3')+'"><div class="slotBig-wrp"><span data-title="{{=snip.slotTitle(slot)}}"><img src="https://test.waysofhistory.com/img/buildings2/3_1_12.png"></span><div class="slotLevelBig-wrp" style="left: 0px; top: 0px;"><div class="slotLevelBig -type-0">1</div></div></div></a></span></span>'
    },// = Ров 1 уровня	
	108: {
        giver: Quest.givers.war,
        name: 'Ров 2 уровня',
        //нормальный вариант
        //text: 'Чем глубже ров вокруг города, тем больше потери врага при нападении на тебя. А сейчас ты уже лакомый кусочек для воинственных соседей. Но твоему городу явно не хватает хорошей защиты. <b>Улучши свой ров вокруг него хотя бы до 2 уровня</b>.<br/>{{=snip.slotImgLevelBigLink(3, 1)}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(3, 2)}}'
        //вариант с 13м сегментом, который будет использоваться здесь и только здесь %)
        text: 'Чем глубже ров вокруг города, тем больше потери врага при нападении на тебя. А сейчас ты уже лакомый кусочек для воинственных соседей. Но твоему городу явно не хватает хорошей защиты. <b>Улучши свой ров вокруг него хотя бы до 2 уровня</b>.<br/><span class="qinf-text-block -hideMob">{{slot = new Slot(3,1);}}<span class="-nobr"><a class="link " href="'+HashMgr.getHref('#/buildinfo/3')+'"><div class="slotBig-wrp"><span data-title="{{=snip.slotTitle(slot)}}"><img src="https://test.waysofhistory.com/img/buildings2/3_1_12.png"></span><div class="slotLevelBig-wrp" style="left: 0px; top: 0px;"><div class="slotLevelBig -type-0">1</div></div></div></a></span>{{=snip.slotArrow()}}{{slot = new Slot(3,2);}}<span class="-nobr"><a class="link " href="'+HashMgr.getHref('#/buildinfo/3')+'"><div class="slotBig-wrp"><span data-title="{{=snip.slotTitle(slot)}}"><img src="https://test.waysofhistory.com/img/buildings2/3_2_12.png"></span><div class="slotLevelBig-wrp" style="left: 0px; top: 0px;"><div class="slotLevelBig -type-0">2</div></div></div></a></span></span>'
    },// = Ров 2 уровня	
	109: {
        giver: Quest.givers.war,
        name: 'Кирка и лопата — наш ответ супостату',
        text: 'Даже если не хочешь мучать и жечь соседей, грабить корованы и волновать округу, тебе придется научиться показывать клыки. Сделай все для защиты своей деревни. <b>Переживи нападение другого игрока</b>. Для защиты все средства хороши... от острого кола на дне рва и метко пущенного камня из пращи, до сныканного добра в глубоком и надежном тайнике. Но помни, что нападение должно быть серьезным. По земле. Не верю я в эти летающие крыломахи, винтокруты и всякие парящие жабы...'
    },
	110: {
        giver: Quest.givers.war,
        name: 'Ров 5 уровня',
        //text: 'Копать всегда, копать везде. Копать - хорошая привычка. Улучши ров до 5 уровня<br/>{{=snip.slotImgLevelBigLink(3, 2)}}{{=snip.slotArrow()}}{{=snip.slotImgLevelBigLink(3, 5)}}'
        text: 'Копать всегда, копать везде. Копать - хорошая привычка. Улучши ров до 5 уровня<br/><span class="qinf-text-block -hideMob">{{slot = new Slot(3,2);}}<span class="-nobr"><a class="link " href="'+HashMgr.getHref('#/buildinfo/3')+'"><div class="slotBig-wrp"><span data-title="{{=snip.slotTitle(slot)}}"><img src="https://test.waysofhistory.com/img/buildings2/3_2_12.png"></span><div class="slotLevelBig-wrp" style="left: 0px; top: 0px;"><div class="slotLevelBig -type-0">4</div></div></div></a></span>{{=snip.slotArrow()}}{{slot = new Slot(3,5);}}<span class="-nobr"><a class="link " href="'+HashMgr.getHref('#/buildinfo/3')+'"><div class="slotBig-wrp"><span data-title="{{=snip.slotTitle(slot)}}"><img src="https://test.waysofhistory.com/img/buildings2/3_3_12.png"></span><div class="slotLevelBig-wrp" style="left: 0px; top: 0px;"><div class="slotLevelBig -type-0">5</div></div></div></a></span></span>'
    },// = Ров 5 уровня	
};

