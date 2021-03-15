const fs = require('fs');
const readline = require('readline');
const path = require('path');

function Utils(){};


Utils.prototype.sizeOf = function(obj){
	var count = 0, key;
	for(key in obj) ++count;
	
	return count;
};

Utils.prototype.escapeRegExp = function(str){
	return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

Utils.prototype.log = function(){
	console.log.apply(console, arguments);
};

Utils.prototype.logError = function(){
	console.error.apply(console, arguments);
};

Utils.prototype.logWarn = function(){
	console.warn.apply(console, arguments);
};

Utils.prototype.logInlineStart = function(){
	utils._logInlineStart = true;
};

Utils.prototype.logInline = function(log){
	if( utils._logInlineStart )
		utils._logInlineStart = false;
	else{
		//process.stdout.write('\033[1A\r');
		//process.stdout.clearLine();
		//process.stdout.cursorTo(0);
		
		readline.clearLine(process.stdout);
		readline.cursorTo(process.stdout, 0);
	}
	
	process.stdout.write(log);
};

Utils.prototype.logInlineEnd = function(){
	process.stdout.write('\n');
};

Utils.prototype.prepareArgv = function(processArgv){
	const argv = [];
	
	for(var arg in processArgv){
		if( arg < 2 )
			continue; // Системные аргументы
		
		argv.push(processArgv[arg]);
	}
	
	return argv;
};

Utils.prototype.prepareArgp = function(argv){
	const argp = {};
	
	for(var arg in argv){
		arg = argv[arg].split('=');
		
		arg[0] = arg[0].trim();
		
		if( arg[1] === undefined )
			argp[arg[0]] = true;
		else
			argp[arg[0]] = arg[1].trim();
	}
	
	return argp;
};

Utils.prototype.terminateProcessAfterPress = function(){
	process.stdin.resume();
	process.stdin.setEncoding( 'utf8' );
	process.stdin.on('data', function(key){  
		process.exit();
	});
};


Utils.prototype.removeDir = function(dir) {
	if( dir[dir.length-1] != '/' )
		dir += '/';
	
	if( !utils.isDirExist(dir) )
		return;
	
	fs.readdirSync(dir).forEach(function(file, index){
		var filePath = dir + file;
		
		if( fs.lstatSync(filePath).isDirectory() ) {
			utils.removeDir(filePath);
		} else {
			fs.unlinkSync(filePath);
		}
	});
	
	try{
		fs.rmdirSync(dir);
	}
	catch(e){
		utils.removeDir(dir);
	}
};

Utils.prototype.isDirExist = function(dir){
	return fs.existsSync(dir);
};

Utils.prototype.makeDir = function(dir){
	dir = dir.replace(/(\/|\\)$/, '');
	
	if( !utils.isDirExist(dir) )
		fs.mkdirSync(dir);
};

Utils.prototype.copyDir = function(from, to, opt){
	opt = opt||{};
	
	let files = [];
	
	try{
		files = utils.getFiles(from, {includeDirs: true, depth: 1});
	}
	catch(e){}
	
	if( !files.length )
		return;
	
	if( to[to.length-1] != '/' )
		to += '/';
	
	utils.removeDir(to);
	
	utils.makeDir(to);
	
	let file, outputFile;
	
	for(file in files){
		file = files[file];
		
		outputFile = to + file.replace(from, '');
		
		if( opt.filter ){
			if( !opt.filter(file, {isDir: fs.statSync(file).isDirectory()}) )
				continue;
			
			utils.copyDir._copy(file, outputFile, opt);
		}
		else
			utils.copyDir._copy(file, outputFile, opt);
	}
	
};

	Utils.prototype.copyDir._copy = function(from, to, opt){
		if( fs.statSync(from).isDirectory() )
			utils.copyDir(from, to, opt)
		else
			utils.copyFile(from, to);
	};

Utils.prototype.writeFile = function(filePath, text){
	fs.writeFileSync(filePath, text);
}

Utils.prototype.writeLog = function(filePath, text){
	utils.makeDir('log');
	
	utils.writeFile('log/' + filePath, text);
}

Utils.prototype.appendFile = function(filePath, text){
	fs.appendFileSync(filePath, text);
}

Utils.prototype.readFile = function(filePath){
	try{
		return fs.readFileSync(filePath).toString();;
	}
	catch(e){
		console.error('Error: ', e);
		
		throw e;
	}
};

Utils.prototype.copyFile = function (filePath, distPath){
	try{
		fs.copyFileSync(filePath, distPath);
	}
	catch(e){
		utils.logError(e);
	}
};

Utils.prototype.getFiles = function (dir, opt){
	opt = opt||{};
	opt.files = opt.files||[];
	
	if( typeof(opt.depth) == 'number' ){
		if( opt.depth > 0 )
			--opt.depth;
		else
			return opt.files;
	}	
	
	if( dir[dir.length-1] != '/' )
		dir += '/';
	
    var files = fs.readdirSync(dir);
	
    for (var i in files){
        var name = dir + files[i];
		
        if (fs.statSync(name).isDirectory()){
			if( opt.exludedDirs && opt.exludedDirs.indexOf(files[i]) != -1 ){
				// Исключаем ненужные папки
			}
			else if( !opt.dirs || opt.dirs.indexOf(files[i]) != -1 ){
				if( opt.includeDirs ){
					if( opt.useConsole )
						console.log(name);
						
					opt.files.push(name);
				}
					
				utils.getFiles(name, opt);
			}
        } 
		else{
			if( opt.exludedFiles && opt.exludedFiles.indexOf(files[i]) != -1 ){
				// Исключаем ненужные файлы
			}
			else{
				if( opt.useConsole )
					console.log(name);
				
				opt.files.push(name);
			}
		}
    }
	
    return opt.files;
};



const utils = new Utils();

exports.utils = utils;
