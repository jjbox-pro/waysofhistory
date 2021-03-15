TextParser = {
	iterate: function(what, run) {
		for (var smlGroup in what) {
			var group = what[smlGroup];
			for (var smlClass in group) {
				run(smlGroup, smlClass, group[smlClass]);
			}
		}
	},
	
	//вычисляем регулярки
	calcRegExp: function(){
		this.iterate(TextParser.all, function(smlGroup, smlClass, smlData){
			if (smlGroup == 'tags') {
				smlData.reg = new RegExp('\\['+smlClass+'[^\\]]+\\]', 'g');
			} else {
				if (!smlData.names.length) return;
				var regText = '';
				for (var name in smlData.names) {
					name = smlData.names[name];
					regText += regText.length? '|': '';
					regText += '('+name.replace('[', '\\[').replace(']', '\\]').replace(')', '\\)').replace('(', '\\(').replace('|', '\\|').replace('*', '\\*').replace('$', '\\$')+')';
				}
				smlData.reg = new RegExp(regText, 'g');	
			}
		});
	},
	
	showSmiles: function(text){
		//смайлы
		this.iterate(TextParser.smiles, function(smlGroup, smlClass, smlData){
			if (!smlData.reg || !text) return;
			text = text.replace(smlData.reg, snip.smile(smlData, smlClass, smlGroup));
		});
		//иконки
		//str = str.replace(/\[a\]/g, '<img src="https://test.waysofhistory.com/img/_.gif" class="iconAcc">');
		
		return text;
	},
	
	hideSmiles: function(str){
		/*return str.replace(
			/<img[^>]*>/g, 
			function(a){return a.match(/data-symb="([^"]*)/)[1];})*/
		var str = str.replace(
			/<img[^>]*>/g, 
			function(str){
				return TextParser.getSymbByEl($(str));
			});
		return str;
	},
		
	getSymbByEl: function(el){
		if (el.hasClass('smile')) {
			//смайлы
			return TextParser.smiles[el.data('type')][el.data('id')].names[0];
		} else {
			/*//иконки
			if (el.hasClass('iconAcc')){
				return '[a]';
			}*/
		}
		return '';
		
	},
	
	getSmileGroup: function(smileId){
		for (var group in TextParser.smiles) {
			if (TextParser.smiles[group][smileId]) {
				return group
			}
		}
		return false;
	},
	
	showTags: function(text){
		this.iterate({tags: TextParser.tags}, function(smlGroup, smlClass, smlData){
			text = text.replace(smlData.reg, function(str){
				str = str.slice(2, -1).split('/');
				for(var i in str)
					str[i] = decodeURIComponent(str[i]).replace(/\[/g, '⋇'); // Используем редкий символ, чтобы исключить обработку тегов вложенных в теги
				return smlData.ext(str);
			});
		});
		return text.replace(/⋇/g, '[');
	},

	replaceBR: function(text){
		return text.replace(/\n/g, '<br>');
	},
	
	escapeBR: function(text){
		return text.replace(/<br>/g, '\n');
	},
	
	replaceExtLinks: function(text){
		return text.replace(/(http|https):\/\/[^\s<]*/g, '<a class="link" href="$&" target="_blank">$&</a>');
	},

	prepare: function(text, opt){
		opt = opt||{};
		
		//показ тегов
		text = this.showTags(text);
		
		//вставка <br>
		text = this.replaceBR(text);
		
		if (opt.showSmiles)
			text = this.showSmiles(text);
		
		//преобразование внешних ссылок из текста в нормальные ссылки
		if (opt.extLinks)
			text = this.replaceExtLinks(text);

		return text;
	},

	noLinks: function(text){
		return text.replace(/<a/g, '<span').replace(/<\/a/g, '</span');
	},
	
	checkCanLinks: function(text){
		return Quest.isUnavail(Quest.ids.sciGive4) && /(http|https):\/\/[^\s<]*/.test(text); 
	}
};

TextParser.tags = {
	t: {ext: function(arr){
		var town = new Town(arr);
		return snip.townLink(town);
	}},//город код
	p: {ext: function(arr){
		var acc = new Account(arr);
		return snip.accLink(acc);
	}},//игрок код
	c: {ext: function(arr){
		var country = new Country(arr);
		return snip.countryLink(country);
	}},//страна код
	b: {ext: function(arr){
		return snip.buildLink(arr[0]);
	}},//постройка код
	u: {ext: function(arr){
		return snip.unitLink(arr[0]);
	}},//юнит код
	s: {ext: function(arr){
		return snip.scienceLink(arr[0]);
	}},//наука код
	r: {ext: function(arr){
		if (arr.length == 1){
			return '<a class="link" href="'+HashMgr.getHref('#/report/'+arr[0])+'">'+arr[0]+'</a>';
		} else {
			return TextParser.reportParse(arr);
			
		}
	}},//отчёт код
	m: {ext: function(arr){
		return '<a class="link" href="'+HashMgr.getHref('#map/o='+arr[0]+'&x='+arr[1]+'&y='+arr[2])+'">('+arr[0]+'/'+arr[1]+'/'+arr[2]+')</a>';
	}},//место на карте o/x/y
	g: {ext: function(arr){
		var town = new Town({id: arr[2], name: arr[3]});
		return snip.icon(snip.c.other, 'oper') + '<a class="link" href="'+HashMgr.getHref('#/sendArmy/groupid='+arr[0]+'&key='+arr[1])+'">Военная операция </a>('+snip.townLink(town)+')';
	}},//военная операция код/ключ|город-код/город-имя
	w: {ext: function(arr){
		return snip.link(HashMgr.getHref('#message/'+arr[0]), snip.icon(snip.c.townIcon, 'message')+arr[0], 'link');
	}},//переписка код
	i: {ext: function(arr){
		var tactic = new Tactic();
		tactic.setId(arr[0]);
		tactic.setSecret(arr[1]);
		tactic.setName(arr[4]);
		
		return snip.tacticLink(tactic);
	}},// id, secret, accId, accName, tacticName
};

TextParser.resSmiles = {
	res0: {title: lib.resource.data[0].name, names: ['{knowledge}','{sci}']},
	res1: {title: lib.resource.data[1].name, names: ['{money}']},
	res2: {title: lib.resource.data[2].name, names: ['{food}']},
	res3: {title: lib.resource.data[3].name, names: ['{wood}']},
	res4: {title: lib.resource.data[4].name, names: ['{metal}']},
	res5: {title: lib.resource.data[5].name, names: ['{fuel}']},
	res6: {title: lib.resource.data[6].name, names: ['{stone}']},
	res7: {title: lib.resource.data[7].name, names: ['{horse}']},
	res8: {title: lib.resource.data[8].name, names: ['{sulfur}']},
	//res9: {title: lib.resource.data[9].name, names: ['{aluminium}']},
	res10: {title: lib.resource.data[10].name, names: ['{uranium}']},
	res11: {title: lib.resource.data[11].name, names: ['{fruit}']},
	res12: {title: lib.resource.data[12].name, names: ['{corn}']},
	res13: {title: lib.resource.data[13].name, names: ['{wheat}']},
	res14: {title: lib.resource.data[14].name, names: ['{rice}']},
	res15: {title: lib.resource.data[15].name, names: ['{fish}']},
	res16: {title: lib.resource.data[16].name, names: ['{meat}']},
	res17: {title: lib.resource.data[17].name, names: ['{vine}']},
	res18: {title: lib.resource.data[18].name, names: ['{jevel}']},
	res19: {title: lib.resource.data[19].name, names: ['{cloth}']},
	//res20: {title: lib.resource.data[20].name, names: ['{music}']},
	res21: {title: lib.resource.data[21].name, names: ['{movie}']},
	res22: {title: lib.resource.data[22].name, names: ['{book}']},
}

TextParser.emoSmiles = {
	s5: {title: '', names: ['{]:)}']},
	s23: {title: '', names: ['{(:|}']},
	s0: {title: '', names: ['{:)}']},
	s1: {title: '', names: ['{:D}']},
	s2: {title: '', names: ['{rofl}']},
	s3: {title: '', names: ['{mm}']},
	s4: {title: '', names: ['{:p}']},
	s6: {title: '', names: ['{inlove}']},
	s7: {title: '', names: ['{;)}']},
	s8: {title: '', names: ['{:$}']},
	s9: {title: '', names: ['{yawn}']},
	s10: {title: '', names: ['{:(}']},
	s11: {title: '', names: ['{:[)}']},
	s12: {title: '', names: ['{:|}']},
	s13: {title: '', names: ['{|-)}']},
	s14: {title: '', names: ['{:O}']},
	s15: {title: '', names: ['{wartime}']},
	s16: {title: '', names: ['{;(}']},
	s17: {title: '', names: ['{doh}']},
	s18: {title: '', names: ['{:S}']},
	s19: {title: '', names: ['{angry}']},
	s20: {title: '', names: ['{cool}']},
	s21: {title: '', names: ['{:*}']},
	s22: {title: '', names: ['{puke}']},
	s24: {title: '', names: ['{:x}']},
	s25: {title: '', names: ['{facepalm}']},
	s26: {title: '', names: ['{troll}']},
	s27: {title: '', names: ['{king}']},
	s28: {title: '', names: ['{angel}']},
	s29: {title: '', names: ['{party}', '{pinkiepie}']},
	s30: {title: '', names: ['{brain}']},
	s31: {title: '', names: ['{beer}']},
	s32: {title: '', names: ['{popcorn}']},
};

TextParser.smiles = {
	res: TextParser.resSmiles,
	emo: TextParser.emoSmiles
};

TextParser.all = {
	tags: TextParser.tags,
	res: TextParser.resSmiles,
	emo: TextParser.emoSmiles
};

// [r[id]/[code]/[тип]/[время]/[аккid]/[аккимя]/[городid]/[городимя]]
TextParser.reportParse = function(arr){
	var link = '<a class="link" href="'+HashMgr.getHref('#/report/'+arr[0]+'-'+arr[1])+'">',
		linkCont = '',
		repTitle = '',
		icon = 'report';
	
	switch( +arr[2] ){
		case Report.type.battleFull: 
		case Report.type.battleShort:
		case Report.type.attackAir:
		case Report.type.attackWater:
			icon = 'battle';
	}
	
	linkCont += snip.icon(snip.c.townIcon, icon);
	
	var acc = new Account([arr[4], arr[5]]);
	if( +arr[6] ){
		var town = new Town([arr[6], arr[7]]);
		town.account = acc;
	}
	
	linkCont += town ? snip.town(town) : snip.acc(acc);

	link += repTitle + linkCont + ' — ' + timeMgr.fMomentDate(arr[3]) + '</a>';
	
	return link;
};

TextParser.calcRegExp();