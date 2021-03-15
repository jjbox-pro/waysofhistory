
//список рас

function Races(racebin) {
	this.racebin = racebin;
}

//в списке все расы
Races.prototype.hasAll = function() {
	return this.racebin == (1 << utils.sizeOf(Race.ids)) - 1;
}

//в списке есть определеная раса
Races.prototype.hasRace = function(raceId) /*(race)*/{
	if(raceId instanceof Race) raceId = raceId.getId();
	return (this.racebin & (1 << raceId)) > 0;
};

//список рас
Races.prototype.getList = function() {
	var list = [];
	
	for (var i in Race.ids) {
		var raceId = Race.ids[i];
		
		if( this.hasRace(raceId) )
			list.push(new Race(raceId));
	}
	
	return list;
};
