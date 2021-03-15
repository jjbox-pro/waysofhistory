function DepositList() {
	this.list = {};
	this.elemClass = Deposit;
}

utils.extend(DepositList, CountList);

DepositList.getAll = function (definedOnly) {
    var list = new DepositList();
    for (var i=0; i<lib.map.deposit.length; i++) {
        if( definedOnly && (i == Deposit.no || i == Deposit.undefined) ) 
			continue;
        
		list.addElem(new Deposit(i));
    }
    return list;
};