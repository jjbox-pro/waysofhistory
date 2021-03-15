function BaseTacticsList(arr) {
	'use strict';
	
	this.elemClass = Tactic;
	
	this.list = [];
	
	this.parse(arr);
};

utils.extend(BaseTacticsList, ArrayList);

BaseTacticsList.prototype.clone = function(){
	return new this.constructor(this.extractData());
};

BaseTacticsList.prototype.unpackExtData = function(arr){
	if( !arr ) return;
	
	this.each(function(arrayElem, index){
		if( arr[index] )
			arrayElem.unpackExtData(arr[index]);
	});
};

BaseTacticsList.prototype.extractData = function(){
	var arr = [];
	
	this.each(function(arrayElem, index){
		arr[index] = arrayElem.extractData();
	});
	
	return arr;
};

BaseTacticsList.prototype.extractExtData = function(){
	var data = {};
	
	this.each(function(arrayElem, index){
		var extData = arrayElem.extractExtData();
		
		if( extData )
			data[index] = extData;
	});
	
	if( utils.sizeOf(data) )
		return data;
	
	return false;
};



function TacticsList(arr) {
	'use strict';
	
	TacticsList.superclass.constructor.apply(this, arguments);
};

utils.extend(TacticsList, BaseTacticsList);

TacticsList.prototype.getLastUpd = function(){
	var lastUpdTactic = false,
		lastUpd = 0;
	
	
	this.each(function(tactic){
		if( tactic.getUpd() && tactic.getUpd() > lastUpd ){
			lastUpd = tactic.getUpd();
			
			lastUpdTactic = tactic;
		}
	});
	
	return lastUpdTactic;
};

TacticsList.prototype.getElemById = function(id){
	return this.each(function(arrayElem){
		if( arrayElem.getId() == id )
			return arrayElem;
	});
};

TacticsList.prototype.getMaxOverflowCount = function(){
	return this.getLength() - this.getMaxLength();
};

TacticsList.prototype.getMaxLength = function(){
	return TacticsList.getMaxLength();
};

TacticsList.prototype.isMaxOverflow = function(strict){
	var count = this.getMaxOverflowCount();
	
	return strict ? count > 0 : count >= 0;
};


TacticsList.getMaxLength = function(){
	return lib.war.tactics.max + (wofh.account.isPremium() ? lib.war.tactics.maxpremium : 0);
};



function TacticItemsList(arr) {
	'use strict';
	
	this.elemClass = TacticItem;
	
	this.list = [];
	
	this.parse(arr);
};

utils.extend(TacticItemsList, BaseTacticsList);



function TacticWavesList(arr) {
	'use strict';
	
	this.elemClass = TacticWave;
	
	this.list = [];
	
	this.parse(arr);
};

utils.extend(TacticWavesList, TacticItemsList);

TacticWavesList.prototype.unpack = function(){
	var nextStart = 1;
	this.each(function(wave, index){
		wave.clacRange(nextStart);
		
		nextStart = wave.getRangeLimit();
		
		wave.setIndex(index);
	});
};

/*
	index - индекс волны с которой нучно начать смещение диапазонов
	start - начальное значение диапазона
	end - конечное значение диапазона (может не быть)
	isDelete - флаг указывающий, что волна удаляется
*/
TacticWavesList.prototype.shiftRanges = function(index, start, end, isDelete){
	if( index != (this.getLength() - 1) && start ){
		var newStart = isDelete ? start : ((end ? end : start) + 1);
		
		this.each(function(wave){
			var waveRange = wave.getRange();
			
			waveRange.start = newStart;
			
			waveRange.end = waveRange.val ? newStart + waveRange.val : undefined;

			newStart = wave.getRangeLimit();
		}, index + 1);
	}
};



function TacticRulesList(arr) {
	'use strict';

	this.elemClass = TacticRule;
	
	this.list = [];
	
	this.parse(arr);
};

utils.extend(TacticRulesList, TacticItemsList);

TacticItemsList.prototype.hasRule = function(tacticRule){
	return !!this.hasElem(tacticRule);
};



// Список Условия в правиле
function TacticRuleCondsList(str) {
	'use strict';
	
	this.elemClass = TacticRuleCond;
	
	this.list = [];
	
	this.parse(str);
};

utils.extend(TacticRuleCondsList, TacticRulesList);

TacticRuleCondsList.prototype.parse = function(str){
	this.strList = str||'';
	
	this.unpack();
};

TacticRuleCondsList.prototype.unpack = function(){	
	this.unpackType();
	
	this.unpackList();
};

TacticRuleCondsList.prototype.unpackType = function(){
	this.setType(this.strList[this.strList.search('\\'+TacticRuleCondsList.type.OR+'|'+TacticRuleCondsList.type.AND)]||TacticRuleCondsList.type.OR);
};

TacticRuleCondsList.prototype.unpackList = function(){
	if( !this.strList ) return;
	
	var list = this.strList.split(this.getType());
	
	for(var i = 0; i < list.length; i++)
		this.addElem(new this.elemClass(list[i])).index = i;
};

TacticRuleCondsList.prototype.getType = function(){
	return this.type;
};

TacticRuleCondsList.prototype.setType = function(type){
	return this.type = type;
};

TacticRuleCondsList.prototype.extractData = function(){
	var arr = [];
	
	this.each(function(arrayElem){
		arr.push(arrayElem.extractData());
	});
	
	return arr.join(this.getType());
};

TacticRuleCondsList.prototype.hasType = function(){
	return this.getType() != TacticRuleCondsList.type.NO;
};

TacticRuleCondsList.prototype.hasFortUnit = function(){
	return this.each(function(arrayElem){
		if( arrayElem.isFortUnit() )
			return true;
	});
};

TacticRuleCondsList.prototype.isEqual = function(tacticRuleCondList){
	if( this.getType() != tacticRuleCondList.getType() )
        return false;
	
	return TacticRuleCondsList.superclass.isEqual.apply(this, arguments);
};

TacticRuleCondsList.prototype.isEmpty = function(){
	return !this.extractData();
};

// Тип условия для правила ("И" или "ИЛИ")
TacticRuleCondsList.type = {
	OR: '|',
	AND: '&',
	NO: ''
};

// Максимальное количество условий для правила
TacticRuleCondsList.maxCount = 5;



function TacticItemTmplsList(arr) {
	'use strict';

	this.elemClass = TacticItemTmpl;
	
	this.list = [];
	
	this.parse(arr);
};

utils.extend(TacticItemTmplsList, TacticItemsList);