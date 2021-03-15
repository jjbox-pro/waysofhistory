function BaseTacticItem(data) {
	'use strict';
	
	this.parse(data);
};

utils.extend(BaseTacticItem, ArrayElem);

BaseTacticItem.prototype.clone = function () {
	var data = {};
	
	utils.copyProperties(data, this, {noObjects: true});
	
	data.data = this.extractData();
	
    return new this.constructor(data);
};

BaseTacticItem.prototype.getData = function(){return this.data;};

BaseTacticItem.prototype.extractData = function(){};

BaseTacticItem.prototype.extractExtData = function(){};



function Tactic(data) {
    'use strict';
	
	this.parse(data);
}

utils.extend(Tactic, BaseTacticItem);

Tactic.prototype.unpack = function(){
	this.data = this.data||{};
	
	this.unpackWaves();
	
	this.unpackRules();
	
	this.unpackReserve2();
	
	this.unpackExtData();
};

Tactic.prototype.unpackExtData = function(){
	var extData = this.getExtData();
	
	this.setUpd(extData.upd||0);
	
	this.getWaves().unpackExtData(this.getExtData().waves);
	
	this.getRules().unpackExtData(this.getExtData().rules);
	
	if( !this.getName() && extData.name )
		this.setName(extData.name);
};

Tactic.prototype.unpackWaves = function(){
	if ( this.getWaves() instanceof TacticWavesList ) return;
	
	this.waves = new TacticWavesList(utils.clone(this.data.waves||[]));
};

Tactic.prototype.unpackRules = function(){
	if ( this.getRules() instanceof TacticRulesList ) return;
	
	this.rules = new TacticRulesList(utils.clone(this.data.rules||[]));
};

Tactic.prototype.unpackReserve2 = function(){
	if ( this.getReserve2() instanceof TacticReserve2 ) return;
	
	this.reserve2 = new TacticReserve2(this.data.reserve2||'');
};

Tactic.prototype.getExtData = function(){
	return this.getData().data||{};
};

Tactic.prototype.getId = function(){
	return this.id;
};

Tactic.prototype.getSecret = function(){
	return this.secret;
};

Tactic.prototype.getName = function(){
	return this.name;
};

Tactic.prototype.getWaves = function(){
	return this.waves;
};

Tactic.prototype.getRules = function(){
	return this.rules;
};

Tactic.prototype.getReserve2 = function(){
	return this.reserve2;
};

Tactic.prototype.getUpd = function(){
	return this.upd;
};

Tactic.prototype.getAccount = function(){
	return this.account;
};

Tactic.prototype.setId = function(id){
	this.id = id;
};

Tactic.prototype.setSecret = function(secret){
	this.secret = secret;
};

Tactic.prototype.setName = function(name){
	this.name = name;
};

Tactic.prototype.setWaves = function(waves){
	this.waves = waves;
};

Tactic.prototype.setUpd = function(upd){
	return this.upd = upd;
};

Tactic.prototype.setRules = function(rules){
	this.rules = rules;
};

Tactic.prototype.extractData = function(noExtData){
	var data = {},
		waves = this.getWaves(),
		rules = this.getRules();
	
	if( waves.getLength() )
		data.waves = waves.extractData();
	
	if( rules.getLength() )
		data.rules = rules.extractData();
	
	data.reserve2 = this.reserve2.extractData();
	
	if( !data.reserve2 ) delete data.reserve2;
	
	if( !noExtData ){
		data.data = this.extractExtData();
	
		if( !data.data ) delete data.data;
	}
	
	return data;
};

Tactic.prototype.extractExtData = function(){
	var data = {},
		waves = this.getWaves(),
		rules = this.getRules();
	
	if( waves.getLength() ){
		data.waves = waves.extractExtData();
		
		if( !data.waves )
			delete data.waves;
	}
	
	if( rules.getLength() ){
		data.rules = rules.extractExtData();
		
		if( !data.rules )
			delete data.rules;
	}
	
	if( this.getName() )
		data.name = utils.escapeHtml(utils.unescapeHtml(this.getName())); // 1. Делаем unescape от escape'а сервером. 2. Ескейпим имя самостоятельно
	
	data.upd = timeMgr.getNow();
	
	if( utils.sizeOf(data) )
		return data;
	
	return false;
};

Tactic.prototype.extractFullData = function(noExtData){
	var data = {};
	
	data.id = this.getId();
	data.secret = this.getSecret();
	data.name = this.getName();
	
	data.data = this.extractData(noExtData);
	
	return data;
};

Tactic.prototype.isEqual = function(tactic){
	if( 
		this.getWaves().getLength() != tactic.getWaves().getLength() ||
		this.getRules().getLength() != tactic.getRules().getLength() || 
		!this.reserve2.isEqual(tactic.reserve2) 
	){
		return false;
	}
	
	if( !this.getWaves().isEqual(tactic.getWaves()) )
		return false;
	
	if( !this.getRules().isEqual(tactic.getRules()) )
		return false;
	
	return true;
};

Tactic.prototype.isEmpty = function(){
	return this.getReserve2().isEmpty() && this.getWaves().isEmpty() && this.getRules().isEmpty();
};

Tactic.prototype.isUnknown = function(){
	return !this.getId();
};





function TacticItem() {
	'use strict';
};

utils.extend(TacticItem, BaseTacticItem);

TacticItem.prototype.clone = function () {
	var clone = new this.constructor(this.extractData());
	
	utils.copyProperties(clone, this, {noObjects: true});
	
    return clone;
};

TacticItem.prototype.parse = function(data){
	this.setData(data||{});
	
	this.unpack();
};

TacticItem.prototype.unpack = function(){
	this.unpackArmy();
};

TacticItem.prototype.unpackArmy = function(){
	this.setArmy(new Army(this.getArmy()||''));
};

TacticItem.prototype.unpackExtData = function(data){
	if( data.upls !== undefined )
		this.setUpls(data.upls);
};

TacticItem.prototype.getDataField = function(field, data){
	return (data||this.getData())[field];
};

TacticItem.prototype.getArmy = function(){
	return this.getData().army;
};

TacticItem.prototype.getUpls = function(){
	return this.upls;
};

TacticItem.prototype.getType = function(){
	return this.constructor;
};

TacticItem.prototype.setData = function(data){
	return this.data = data;
};

TacticItem.prototype.setDataField = function(field, val){
	if( val !== undefined )
		this.getData()[field] = val;
};

TacticItem.prototype.setDataFrom = function(tacticItem){
	this.setUpls(tacticItem.getUpls());
};

TacticItem.prototype.setArmy = function(army){
	this.setDataField('army', army);
};

TacticItem.prototype.setUpls = function(upls){
	if( upls === undefined ) return;
	
	this.upls = upls;
};

TacticItem.prototype.deleteDataField = function(field){
	var val = this.getDataField(field);
	
	delete this.getData()[field];
	
	return val;
};

TacticItem.prototype.extractData = function(){ 
	var data = utils.copyProperties(false, this.getData());
	
	data.army = this.getArmy().toString(true);
	
	return data;
};

TacticItem.prototype.extractExtData = function(){
	var data = {};
	
	if( this.getUpls() )
		data.upls = this.getUpls();
	
	if( utils.sizeOf(data) )
		return data;
	
	return false;
};

TacticItem.prototype.isEqual = function(tacticItem){
	return this.getArmy().isEqual(tacticItem.getArmy()) && this.getUpls() == tacticItem.getUpls();
};

TacticItem.prototype.isEmpty = function(){
	return utils.sizeOf(this.getData()) == 0;
};

TacticItem.prototype.isWave = function(){
	return this.is(TacticItem.types.wave);
};

TacticItem.prototype.isRule = function(){
	return this.is(TacticItem.types.rule);
};

TacticItem.prototype.isReserve2 = function(){
	return this.is(TacticItem.types.reserve2);
};

TacticItem.prototype.isTemplate = function(){
	return this.is(TacticItem.types.template);
};

TacticItem.prototype.is = function(Type){
	return this instanceof Type;
};


TacticItem.types = {
	wave: TacticWave,
	rule: TacticRule,
	reserve2: TacticReserve2,
	template: TacticItemTmpl
};



function TacticWave(data) {
	'use strict';
	
	this.parse(data);
};

utils.extend(TacticWave, TacticItem);

TacticWave.prototype.unpack = function(){
	TacticWave.superclass.unpack.apply(this, arguments);
	
	this.unpackCount();
};

TacticWave.prototype.unpackCount = function(){
	this.setCount(this.getCount()||1);
};

TacticWave.prototype.getCount = function(){
	return this.getData().count;
};

TacticWave.prototype.getRange = function(){
	return this.range;
};

TacticWave.prototype.getRangeLimit = function(){
	var range = this.getRange();
	
	return (range.end ? range.end : range.start) + 1;
};

TacticItem.prototype.setCount = function(count){
	this.setDataField('count', count);
};

TacticWave.prototype.setDataFrom = function(tacticItem){
	var data = tacticItem.extractData();
	
	this.parse({army:data.army, count:data.count});
	
	TacticWave.superclass.setDataFrom.apply(this, arguments);
};

TacticWave.prototype.clacRange = function(start){
	var range = {start:start};
	
	if( this.getCount() > 1 ){
		range.val = this.getCount() - 1;
		range.end = range.start + range.val;
	}
	
	return this.range = range;
};

TacticWave.prototype.isEqual = function(tacticWave){
	var isEqual = TacticWave.superclass.isEqual.apply(this, arguments);
	
	return isEqual && this.getCount() == tacticWave.getCount();
};



function TacticRule(data) {
	'use strict';
	
	this.parse(data);
};

utils.extend(TacticRule, TacticItem);

TacticRule.prototype.unpack = function(){
	TacticWave.superclass.unpack.apply(this, arguments);
	
	this.unpackConds();
};

TacticRule.prototype.unpackConds = function(){
	this.setConds(new TacticRuleCondsList(this.getData().rule));
	
	this.deleteDataField('rule');
};

TacticRule.prototype.getConds = function(){
	return this.getData().conds;
};

TacticRule.prototype.setConds = function(conds){
	this.setDataField('conds', conds);
};

TacticRule.prototype.setDataFrom = function(tacticItem){
	var data = tacticItem.extractData();
	
	this.parse({army:data.army, rule:data.rule});
	
	TacticWave.superclass.setDataFrom.apply(this, arguments);
};

TacticRule.prototype.extractData = function(){
	var data = TacticRule.superclass.extractData.apply(this, arguments);
	
	data.rule = this.getConds().extractData();
	
	delete data.conds;
	
	return data;
};

TacticRule.prototype.isEqual = function(tacticRule){
	var isEqual = TacticRule.superclass.isEqual.apply(this, arguments);
	
	return isEqual && this.getConds().isEqual(tacticRule.getConds());
};


function TacticRuleCond(str) {
	'use strict';
	
	this.parse(str);
};

utils.extend(TacticRuleCond, TacticItem);

TacticRuleCond.prototype.parse = function(str){
	this.data = str||TacticRuleCond.emptyCond;
	
	this.unpack();
};

TacticRuleCond.prototype.unpack = function(){
	this.storeDataBeforeUnpack();
	
	this.unpackSide();
	
	this.unpackCountType();
	
	this.unpackUnit();	
	
	this.unpackCount();
	
	this.unpackEquality();
	
	this.restoreDataAfterUnpack();
};

TacticRuleCond.prototype.storeDataBeforeUnpack = function(){
	this.storedData = this.getData();
};

TacticRuleCond.prototype.restoreDataAfterUnpack = function(){
	this.setData(this.storedData);
	
	delete this.storedData;
	
	if( this.countNumeric )
		delete this.countNumeric;
};

TacticRuleCond.prototype.unpackSide = function(){
	var side = TacticRuleCond.side.enemy;
	
	if( this.getDataField(0) == TacticRuleCond.side.my )
		side = TacticRuleCond.side.my;
	
	this.setSide(side);
};

TacticRuleCond.prototype.unpackCountType = function(){
	var countType = TacticRuleCond.countType.percent,
		dataParts = this.splitDataByCountType();
	
	if( dataParts[1] ){
		countType = TacticRuleCond.countType.numeric;
		
		this.countNumeric = dataParts[1];
		
		this.setData(dataParts[0]);
	}
	
	this.setCountType(countType);
};

TacticRuleCond.prototype.unpackUnit = function(){
	var leftOffset = this.isMySide() ? 1 : 0,
		rightOffset = leftOffset;
	
	// Учитываем фортификационное сооружение или шаблон "любой юнит". Их код состоит из одного символа, а не из двух
	if( this.getDataField(leftOffset) == Unit.tagCodes.fort || this.getDataField(leftOffset) == Unit.tagCodes.any )
		--rightOffset;
	
	var code = this.getData().slice(0+leftOffset, 2+rightOffset);
	
	if( code != TacticRuleCond.emptyUnit )
		this.setUnit(new Unit(code, this.getData().slice(3+rightOffset)));
};

TacticRuleCond.prototype.unpackCount = function(){
	var count;
	
	if( this.hasUnit() )
		count = this.countNumeric||this.getUnit().getCount();
	else{
		var offset = this.isMySide() ? 1 : 0;

		count = this.getData().slice(3+offset);
	}
	
	this.setCount(count);
};

TacticRuleCond.prototype.unpackEquality = function(){
	var offset = this.isMySide() ? 1 : 0;
	
	if( this.isFortUnit() || this.isAnyUnit() )
		--offset;
	
	this.setEquality(this.getDataField(2+offset));
};

TacticRuleCond.prototype.getSide = function(){
	return this.side;
};

TacticRuleCond.prototype.getUnit = function(){
	return this.unit;
};

TacticRuleCond.prototype.getCount = function(isForExtract){
	var count = this.count,
		unit = this.getUnit();
	
	if( isForExtract && unit ){
		if( this.isNumericCountType() && !this.isOnlyNumericCountType() ){
			var numericCount = count;
			
			count = 1;
		}
		
		if( unit.isTemplate() ){
			var tmplIdCount = UnitTmpl.toTmplIdCount(unit, unit.getId(), count);
			
			count = tmplIdCount.count;
		}
		
		if( numericCount )
			count += TacticRuleCond.countType.numeric + numericCount;
	}
	
	return count;
};

TacticRuleCond.prototype.getCountMax = function(){
	if( this.isFortUnit() )
		return TacticRuleCond.maxFortCount;
	else if( this.isNumericCountType() )
		return TacticRuleCond.maxNumericCount;
	
	return TacticRuleCond.maxCount;
};

TacticRuleCond.prototype.getCountMin = function(){
	if( this.isFortUnit() )
		return TacticRuleCond.minFortCount;
	else if( this.isNumericCountType() ){
		if( this.hasUnit() )
			return this.getUnit().getBattleCost();
		
		return TacticRuleCond.minNumericCount;
	}
	
	return TacticRuleCond.minCount;
};

TacticRuleCond.prototype.getCountType = function(){
	return this.isOnlyNumericCountType() ? TacticRuleCond.countType.numeric : this.countType;
};

TacticRuleCond.prototype.getCountTypeText = function(){
	return TacticRuleCond.countTypeText[this.getCountType()];
};

TacticRuleCond.prototype.getEquality = function(){
	return this.equality;
};

TacticRuleCond.prototype.setSide = function(side){
	this.side = side;
};

TacticRuleCond.prototype.setUnit = function(unit){
	this.unit = unit;
	
	this.checkOnlyNumericCountType();
	
	this.checkCountOverflow();
};

TacticRuleCond.prototype.setCount = function(count){
	this.count = +count;
};

TacticRuleCond.prototype.setCountType = function(countType){
	if( this.isOnlyNumericCountType() )
		countType = TacticRuleCond.countType.numeric;
	
	this.countType = countType;
	
	this.checkCountOverflow();
};

TacticRuleCond.prototype.splitDataByCountType = function(){
	return this.getData().split(TacticRuleCond.countType.numeric);
};

TacticRuleCond.prototype.setEquality = function(equality){
	this.equality = equality;
};

TacticRuleCond.prototype.extractData = function(allowEmptyUnit){
	var str = '';
	
	if( !this.isEmpty() || allowEmptyUnit ){
		str += this.getSide();
		
		if( allowEmptyUnit && !this.hasUnit() )
			str += TacticRuleCond.emptyUnit;
		else
			str += this.getUnit().getCode();
		
		str += this.getEquality();
		str += this.getCount(true);
	}
	
	return str;
};

TacticRuleCond.prototype.checkCountOverflow = function(){
	if( this.getCount() && this.getCount() > this.getCountMax() )
		this.setCount(this.getCountMax());
};

TacticRuleCond.prototype.checkOnlyNumericCountType  = function(){
	if( this.isOnlyNumericCountType() )
		this.setCountType(TacticRuleCond.countType.numeric);
};

TacticRuleCond.prototype.hasUnit = function(){
	return !!this.getUnit();
};

TacticRuleCond.prototype.isNumericCountType = function(){
	return this.getCountType() == TacticRuleCond.countType.numeric;
};

TacticRuleCond.prototype.isOnlyNumericCountType = function(){
	// У "любого юнита" типом количества могут быть только габаритные единицы
	return this.isAnyUnit();
};

TacticRuleCond.prototype.isMySide = function(){
	return this.getSide() == TacticRuleCond.side.my;
};

TacticRuleCond.prototype.isEqual = function(tacticRuleCond){
	if( this.isEmpty() || tacticRuleCond.isEmpty() )
		return this.isEmpty() && tacticRuleCond.isEmpty();
	
	if( 
		this.getSide() != tacticRuleCond.getSide() || 
		this.getUnit().getId() != tacticRuleCond.getUnit().getId() || 
		this.getEquality() !=  tacticRuleCond.getEquality() || 
		this.getCount() != tacticRuleCond.getCount() || 
		this.getCountType() != tacticRuleCond.getCountType()
	)
		return false;
	
	return true;
};

TacticRuleCond.prototype.isEmpty = function(){
	return !this.hasUnit();
};

TacticRuleCond.prototype.isTemplateUnit = function(){
	return this.hasUnit() && this.getUnit().isTemplate();
};

TacticRuleCond.prototype.isFortUnit = function(){
	return this.hasUnit() && this.getUnit().isFort();
};

TacticRuleCond.prototype.isAnyUnit = function(){
	return this.hasUnit() && this.getUnit().isAny();
};





TacticRuleCond.side = {my: '!',	enemy: ''};

TacticRuleCond.emptyUnit = '--';

TacticRuleCond.equality = {more: '>', notmore: '<'};

TacticRuleCond.defCount = 1;

TacticRuleCond.minCount = 1;

TacticRuleCond.maxCount = 99;

TacticRuleCond.minNumericCount = 1;

TacticRuleCond.maxNumericCount = lib.war.battleunitsmax;

TacticRuleCond.minFortCount = 1;

TacticRuleCond.maxFortCount = 2;

TacticRuleCond.countType = {percent: '%', numeric: '/'};

TacticRuleCond.countTypeText = {};
TacticRuleCond.countTypeText[TacticRuleCond.countType.percent] = '%';
TacticRuleCond.countTypeText[TacticRuleCond.countType.numeric] = 'г.ед';

TacticRuleCond.emptyCond = TacticRuleCond.side.enemy + TacticRuleCond.emptyUnit + TacticRuleCond.equality.more + TacticRuleCond.defCount;



function TacticReserve2(reserve2) {
	'use strict';
	
	this.parse({army:reserve2});
};

utils.extend(TacticReserve2, TacticItem);

TacticReserve2.prototype.extractData = function(){
	return this.getArmy().toString(true);
};

TacticReserve2.prototype.isEmpty = function(){
	return !this.getArmy().getLength();
};



function TacticItemTmpl(data) {
	'use strict';
	
	this.parse(data);
};

utils.extend(TacticItemTmpl, TacticItem);

TacticItemTmpl.prototype.parse = function(data){
	TacticItemTmpl.superclass.parse.apply(this, arguments);
};

TacticItemTmpl.prototype.unpack = function(){
	TacticItemTmpl.superclass.unpack.apply(this, arguments);
	
	this.unpackConds();
};

TacticItemTmpl.prototype.getUpls = function(){
	return this.getData().upls;	
};

TacticItemTmpl.prototype.setDataFrom = function(tacticItem){
	this.parse(tacticItem.extractData());
	
	TacticItemTmpl.superclass.setDataFrom.apply(this, arguments);
};

TacticItemTmpl.prototype.setUpls = function(upls){
	this.setDataField('upls', upls);
};

TacticItemTmpl.prototype.extractData = function(){
	var data = TacticItemTmpl.superclass.extractData.apply(this, arguments);
	
	data.rule = this.getConds().extractData();
	
	delete data.conds;
	
	if( !data.rule )
		delete data.rule;
	
	return data;
};

TacticItemTmpl.prototype.isEqual = function(tacticItemTmpl){
	var isEqual = TacticItemTmpl.superclass.isEqual.apply(this, arguments);
	
	return isEqual && this.getConds().isEqual(tacticItemTmpl.getConds());
};

utils.mix(TacticItemTmpl, TacticWave);

utils.mix(TacticItemTmpl, TacticRule);