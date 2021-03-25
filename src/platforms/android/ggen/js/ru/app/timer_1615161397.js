function Timer(time, timezone, locTime, syncDelay){
	this.StMS = 1000;
	this.MtS = 60;
	this.HtS = 3600;
	this.DtS = 86400;
	this.WtS = 604800;
	this.invStMS = 1/this.StMS;
	this.invMtS = 1/this.MtS;
	this.invHtS = 1/this.HtS;
	this.invDtS = 1/this.DtS;
	this.invWtS = 1/this.WtS;
	this.DtH = 24;
	this.invDtH = 1/this.DtH;
	
	this.monthWeek = 4;
	this.weekDays = 7;
	this.workDays = 5;
	
	this.maxTimeoutDelay = 3 * this.WtS * this.StMS;
	
	this.timeIsUp = '00:00:00';
    
	moment.locale('en', {
		monthsShort : ['янв', 'фев', 'март', 'апр', 'май', 'июнь', 'июль', 'авг', 'сен', 'окт', 'нбр', 'дкб']
	});
	
	this.setTime = function(time, timezone, locTime , syncDelay){
		this.syncDelay = syncDelay||9999999999999999;
		this.locTime = utils.toInt(locTime !== undefined ? locTime : Timer.getNowLoc());
		this.servTime = time !== undefined ? time : this.locTime;
		this.timezone = timezone !== undefined ? timezone : Timer.getTimezoneLoc();
	};
	
    this.bind = function(){
        this.timer = setInterval(this.tick, 1000);
    };
	
	this.unbind = function(){
		clearInterval(this.timer);
    };
	
    this.tick = (function(){
        var now, timerNodes, i, $timer, data, timeDif, result, notifs,
            iterator = function(timer){
                $timer = $(timer);
                
                if( $timer.hasClass('-timer-stopped') )
                    return;
                
                data = $timer.data();
                
                switch( data.timertype ){
                    case 'dec':
                        timeDif = data.time - now;
                        
                        result = timeMgr.fPeriod(timeDif, {format: data.format});
                        
                        // Если время закончилось, отрубаем счетчик и рассылаем нотификации если необходимо
                        if( timeDif < 0 ){
                            $timer.removeClass('js-timer');
                            
                            notifs = '' + (data.notifs||'');
                            
                            if( notifs )
                                notifs.split(',').forEach(function(notif){
                                    notifMgr.runEvent(+notif);
                                });
                        }
                        
                        if( data.alerttime && timeDif < data.alerttime )
                            $timer.addClass('-timer-alert');
                        
                        break;
                    case 'inc':
                        timeDif = data.time + now;
                    
                        result = timeMgr.fMoment(timeDif);
                        
                        break;
                    case 'now':
                        result = timeMgr.fMoment(now);
                        
                        break;
                    default:
                        result = '';
                }
                
                if( $timer.is('input') )
                    $timer.val(result);
                else
                    $timer.html(result);
            };
        
        return function(){
            now = timeMgr.getNow();
            
            timerNodes = document.querySelectorAll('.js-timer');
            
            for(i = 0; i < timerNodes.length; i++){
				iterator(timerNodes[i]);
			}
        };
    })();
    
	this.servToLoc = function(time){
        time *= 1000;
        time += new Date().getTimezoneOffset() * 60000; // getTimezoneOffset() - возвращает смещение в минутах
		time += this.timezone * 1000 * 3600;
		
		return moment(Math.round(time));
	};
    
	this.locToServ = function(time){
		time -= this.timezone * 1000 * 3600;
        time -= new Date().getTimezoneOffset() * 60000; // getTimezoneOffset() - возвращает смещение в минутах
        time /= 1000;
		
		return time;
	};
    
    this.isSameDate = function(time, time2) {
		time = +time + lib.main.timeOffset;
		time2 = +(time2 || this.getNow()) + lib.main.timeOffset;
		
        time = this.servToLoc(time);
		
        time2 = this.servToLoc(time2);
		
        return time.startOf('day').isSame(time2.startOf('day'));
    };
    //вывод статичного времени
    this.fMoment = function(time, timeOnly) {
        if( timeOnly || this.isSameDate(time) ) return this.fMomentTime(time);
        else return this.fMomentTime(time)+' '+this.fMomentDate(time);
    };
    
    this.fMomentTime = function(time, addZeroToHour) {
        return this.fMomentFormat(time, (addZeroToHour?'H':'')+'H:mm:ss');
    };
    
    this.fMomentDate = function(time, addZeroToDay) {
        return this.fMomentFormat(time, (addZeroToDay?'D':'')+'D.MM');
    };
	
    this.fMomentFormat = function(time, format) {
		time = +time + lib.main.timeOffset; // +time - time может быть строкой
		
        time = this.servToLoc(time);
		
        return time.format(format);
    };
    
    this.fMomentOr = function(time) {
        return this.isSameDate(time) ? this.fMomentTime(time) : this.fMomentDate(time);
    };
    //вывод промежутка по времен
	this.fPeriod = function(time, opt){
        if( time < 0 )
            return this.timeIsUp;
		
		var timeStr = '';
		
		opt = opt||{};
		opt.format = opt.format||Timer.format.short;
		
		if( opt.only ){
			var mult = 1;
			switch( opt.only ){
				case Timer.dimension.d: mult = this.invDtS; break;
				case Timer.dimension.h: mult = this.invHtS; break;
				case Timer.dimension.m: mult = this.invMtS; break;
			}
			
			timeStr = utils.formatNum(time * mult, {fixed:0}) + this.getDimension(opt.only);
		}
		else if( opt.format == Timer.format.short ){
			if ( time < this.DtS ){
				timeStr = moment(time * this.StMS).utcOffset(0).format('HH:mm:ss') + (opt.showDimension ? this.getDimension(this.getDimensionByTime(time)) : ''); 
			}
			else{
				var days = Math.floor(time * this.invDtS),
					hours = (time - days * this.DtS) * this.invHtS,
					dec = hours - utils.toInt(hours);
					
                hours = utils.toInt(hours) + Math.round(dec);

                if( hours == this.DtH ){
                    days++;
                    hours = 0;
                }

                timeStr = days + this.getDimension(Timer.dimension.d) + (hours ? ' ' + hours + this.getDimension(Timer.dimension.h) : '');
			}
		}
		else{
			var days = opt.daysToHours ? 0 : utils.toInt(time * this.invDtS),
				hours = opt.hoursToMinutes ? 0 : utils.toInt((time = time - days * this.DtS) * this.invHtS),
				minutes = opt.minutesToSeconds ? 0 : utils.toInt((time = time - hours * this.HtS) * this.invMtS),
				seconds = utils.toInt((time - minutes * this.MtS));
			
			if( days )
                timeStr += days + this.getDimension(Timer.dimension.d);
            
			if( !opt.noHours ) {
				if( (opt.noZero || opt.noHoursZero) && !hours ){
					//
				}
				else
					timeStr += (timeStr ? ' ' : '') + hours + this.getDimension(Timer.dimension.h);
			}
			if( !opt.noMinutes ) {
				if( (opt.noZero || opt.noMinutesZero) && !minutes ){
					//
				}
				else
					timeStr += (timeStr ? ' ' : '') + minutes + this.getDimension(Timer.dimension.m);
			}
			if( !opt.noSeconds ){
				if( (opt.noZero || opt.noSecondsZero) && !seconds ){
                    //
				}
				else
					timeStr += (timeStr ? ' ' : '') + seconds + this.getDimension(Timer.dimension.s);
			}
		}
		
		return timeStr;
    };
	
	this.getDimension = function(dimension){
		switch( dimension ){
			case Timer.dimension.d: return ' дн.';
			case Timer.dimension.h: return ' ч.';
			case Timer.dimension.m: return ' м.';
			case Timer.dimension.s: return ' с.';
			default: return '';
		}
	};
	
	this.getDimensionByTime = function(time){
		if (time < 0) return '';
        if (time < this.MtS) return Timer.dimension.s; 
        if (time < this.HtS) return Timer.dimension.m; 
        if (time < this.DtS) return Timer.dimension.h;
		
		return Timer.dimension.d;
	};
	
    this.fPeriodShort = function(time, noDimension){
        var timeMoment = moment(time * 1000).utcOffset(0);

        if (time < 0) {
            return this.timeIsUp;
        }
        if (time < this.MtS){
            return timeMoment.format('s')+'с'; 
        }
        if (time < this.HtS){
            return timeMoment.format('m')+'м'; 
        }
        if (time < this.DtS){
            return timeMoment.format('H')+'ч'; 
        }
        return Math.floor(time/this.DtS) + (!noDimension ? 'дн' : ''); 
    };
    //возвращает начало дня
    this.startDay = function(time){
        if(!time) time = this.getNow();
		
		time = +time + lib.main.timeOffset;
		
        return this.locToServ(this.servToLoc(time).startOf('day').valueOf());
    };
    
    this.addDay = function(time){
        if (!time) time = this.getNow();
		
		time = +time + lib.main.timeOffset;
		
        return this.locToServ(this.servToLoc(time).add(1, 'day').valueOf());
    };
    
    this.getNowMS = function(){
        return this.servTime + Timer.getNowLoc() - this.locTime;
    };
    
    this.getNow = function(){
        return utils.toInt(this.getNowMS());
    };
	
	this.getNowLoc = function(){
        return utils.toInt(Timer.getNowLoc());
    };
	
	this.getNowLocMS = function(){
        return Timer.getNowLocMS();
    };
	
	this.syncTime = function(pastLocTime, servTime){
		var nowLocTime = Timer.getNowLoc();
		if( nowLocTime - pastLocTime < this.syncDelay ){
			this.locTime = utils.toInt(nowLocTime);
			this.servTime = servTime;
			this.syncDelay = nowLocTime - pastLocTime;
		}
    };
	
    this.parseMoment = function(input, format){
        return timeMgr.locToServ(moment(input, format).valueOf());
    };
    
    this.add = function(time, count, unit){
        return timeMgr.locToServ(timeMgr.servToLoc(time).add(count, unit));
    };
	// Получаем день недели (0-понедельник)
	this.getDayOfWeek = function(){
		var time = this.getNow() + lib.main.timezone;
		
        return (time/this.DtS + 3)%7;
    };
	
	this.bind();
	
	this.setTime.apply(this, arguments);
}

Timer.getTimezoneLoc = function(){
	return utils.toInt(new Date().getTimezoneOffset()/-60);
};

Timer.getNowLoc = function(base) {
	return new Date().getTime() * (base||0.001); // По умолчанию клиентское время приводится к секундам
};

Timer.getNowLocMS = function() {
	return Date.now();
};

Timer.numToTime = function(num) {
    //привет Серёге
	num = parseInt(num, 10);
	if (num <= 0) {
		return num === 0 ? '0:00:00' : '*0:00:00';
	}
	var hour = parseInt(num / 3600, 10);
	var min = parseInt(num / 60, 10) % 60;
	var sec = num % 60;
	if (min < 10) {
		min = '0' + min;
	}
	if (sec < 10) {
		sec = '0' + sec;
	}
	return hour + ':' + min + ':' + sec;
};

Timer.format = {
	short: 0,
	full: 1
};

Timer.dimension = {
	d: 'd',
	h: 'h',
	m: 'm',
	s: 's'
};

timeMgr = new Timer();