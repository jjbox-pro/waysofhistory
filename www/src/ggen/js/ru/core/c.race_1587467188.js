function Race (id) {
	this.id = id;
};

Race.prototype.clone = function () {
	return new Race(this.getId());
};

Race.prototype.getId = function () {
	return this.id;
};

Race.prototype.is = function (id) {
	return this.id == id;
};

Race.prototype.getName = function () {
	return Race.names[this.getId()];
};

Race.prototype.getGrownK = function () {
	return this.is(Race.ids.asia) ? lib.town.population.asiagrown : 1;
};

Race.prototype.getGrown = function () {
	return this.getGrownK() * lib.town.population.defaultgrown;
};

Race.prototype.getCultK = function () {
	return this.is(Race.ids.europe) ? lib.town.population.europeculture : 1;
};

Race.prototype.getConsumption = function () {
	return this.constructor.getConsumption(this.getId());
};

Race.prototype.getTrapDamage = function (trapDamage) {
	if (this.is(Race.ids.india)) return trapDamage * lib.war.indiatrapdamage[1] + lib.war.indiatrapdamage[0];
	return trapDamage;
};

Race.prototype.getBuildPay = function () {
	return this.is(Race.ids.africa) ? lib.town.production.afrikaeconomy : 1;
};

Race.prototype.getBonusResId = function () {
	return lib.town.production.raceres[this.getId()][0]
};

Race.prototype.getBonusResEffect = function () {
	return lib.town.production.raceres[this.getId()][1]
};

Race.prototype.getResK = function (res) {
	return res.getId() == this.getBonusResId()? this.getBonusResEffect(): 1;
};

Race.prototype.getTradeSpeed = function () {
	return this.is(Race.ids.asia) ? lib.trade.asiaspeed : lib.trade.speed;
	//полей в час
};

Race.prototype.getAttack = function() {
	return this.is(Race.ids.africa) ? lib.war.afrikaattack : 0;
};



/* static */
Race.getConsumption = function (race) {
	return race == Race.ids.india ? lib.resource.indianconsumptionk : 1;
}


/**
 * константы
 */

Race.ids = {
	india: 0,
	europe: 1,
	asia: 2,
	africa: 3
};

Race.bin = {
	india: 1 << Race.ids.india,
	europe: 1 << Race.ids.europe,
	asia: 1 << Race.ids.asia,
	africa: 1 << Race.ids.africa
};

Race.bin.all = Race.bin.india + Race.bin.europe + Race.bin.asia + Race.bin.africa;

Race.names = ["Индейцы", "Европейцы", "Азиаты", "Африканцы"];

/*

cnst.races = [
	{
		defence: function (def){return 1+1.2*def;},
		tradespeed: lib.trade.speed
	},//индейцы
	{
		defence: function (def){return def;},
		tradespeed: lib.trade.speed
	},//европейцы
	{
		defence: function (def){return def;},
		tradespeed: lib.trade.asiaspeed
	},//азиаты
	{
		defence: function (def){return def;},
		tradespeed: lib.trade.speed
	}//африканцы
];

*/