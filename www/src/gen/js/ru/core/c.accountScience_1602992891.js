function AccountScience (data) {
	'use strict';

	utils.copy(this, data);
};

AccountScience.prototype.getInc = function () {
	return this.inc;
};

AccountScience.prototype.getCurrent = function () {
	return new Science(this.current);
};

AccountScience.prototype.getProgress = function () {
	return this.progress;
};

AccountScience.prototype.getNeed = function () {
	return this.need;
};

AccountScience.prototype.isScienceAvailable = function (id) {
	return !this.state[id] == '-';
};

AccountScience.prototype.calcTotalBonus = function(bonusId){
	var sum = 0;
	
	for (var science in Science.list) {
		science = Science.list[science];

		if (science.isKnown()) {
			sum += science.getBonus(bonusId);
		}
	}
	
	return sum;
};

//расчёт построек, которые можно будет построить если изучить науки
//передаём глубину вложенности - сколько наук глубиной будем искать
//на выходе- список строений, в каждом строении параметр needScience: ScienceList - требуемые науки
AccountScience.prototype.calcFutureBuilds = function(deepness, account){
	account = account||wofh.account;
	
	// Список построек
	var builds = new BuildList(),
		state = Science.getScienceData(false, account).state, // Научно состояние на интерации - берем текущее
		scienceState = ScienceList.getAll().setState(state);

	// Перебираем все доступные науки
	this.calcFutureBuilds_iter(builds, scienceState, deepness-1);
	
	// Убираем те, которые и сейчас доступны (но оставляем те, у которых не изучена наука дающая возможность производить рес)
	builds.unjoinList(account.getResearchedBuilds(true));
	
	this.checkProdSciBuilds(builds);
	
	return builds;
};

    AccountScience.prototype.calcFutureBuildsByWorker = function(deepness, account){
        reqMgr.calcFutureBuilds(deepness, account, function(futureBuilds){
            wofh.account.futureBuilds = futureBuilds;

            notifMgr.runEvent(Notif.ids.accFutureBuilds);
        });

        return new BuildList();
    };

AccountScience.prototype.checkProdSciBuilds = function(builds){
	var buildList = builds.getList();
	
	for(var build in buildList){
		buildList[build].isProdSciStudied(true);
	}
};
//итерация для расчёта построек
AccountScience.prototype.calcFutureBuilds_iter = function(builds, scienceState, deepness){
	//перебираем все доступные науки
	var sciences = scienceState.clone().filterKnown(Science.known.avail, false).getList(),
		build;
	
	for (var science in sciences) {
		science = sciences[science];

		//дополняем список строений
		for(var buildId in science.builds.getList()){
			if( builds.hasElem(buildId) )
				build = builds.getElem(buildId);
			else{
				build = science.builds.getElem(buildId).clone();
				
				delete build.town; // Будущие постройки не привязываются к городу
				
				build.needScience = new ScienceList();
				
				builds.addElem(build);				
			}
			
			//в каждом строении ведем список требуемых наук
			build.needScience.addElem(science);
		}
		
		//если заданная глубина вложенности больше текущей - считаем эту науку изученной и проводим следующую итерацию
		if( deepness > 0 ){
			var nextScienceState = scienceState.clone();
			
			nextScienceState.setScienceKnown(science);
			
			this.calcFutureBuilds_iter(builds, nextScienceState, deepness - 1);
		}
	}
};





// Науки страны
function CountryScience(data){
	'use strict';
	
	utils.copy(this, data);
};