QuestsMgr = function(){
	this.newQuestsList = {};
};


QuestsMgr.prototype.init = function(){
	this.addNotif();
	
	return this;
};

QuestsMgr.prototype.addNotif = function(){
	notifMgr.addListener(Notif.ids.accQuestsMgr, 'quests', function(data){
		data = data||{};
		
		var changes = data.changes,
			hasNewQuests = false;
		
		for( var quest in changes ){
			quest = changes[quest];

			if( Quest.isActive(quest) ){
				this.newQuestsList[quest] = true;
				
				hasNewQuests = true;
			}
			else
				delete this.newQuestsList[quest];
		}
		
		notifMgr.runEvent(Notif.ids.accQuests, changes);
		
		if( hasNewQuests )
			notifMgr.runEvent(Notif.ids.accQuestsNew);
	}, this);
	
	notifMgr.addListener(Notif.ids.accQuestViewedMgr, 'quests', function(questId){
		if( this.newQuestsList[questId] ){
			delete this.newQuestsList[questId];

			notifMgr.runEvent(Notif.ids.accQuestViewed, questId);
		}
	}, this);
};

QuestsMgr.prototype.getNewQuests = function(){
	return this.newQuestsList;
};

QuestsMgr.prototype.getNewQuest = function(questId){
	return this.getNewQuests()[questId];
};

QuestsMgr.prototype.hasNewQuests = function(){
	for(var quest in this.newQuestsList)
		return true;
	
	return false;
};

