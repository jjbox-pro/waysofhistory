const {utils} = require('jjbox-utils');

(function(){
	console.clear();
	
	const 	argv = utils.prepareArgv(process.argv),
			argp = utils.prepareArgp(argv);
	
	let config;
	
	try{
		config = JSON.parse(utils.readFile('config.json'));
	}
	catch(e){
		utils.logError('Error parse config.json file!');
		
		return;
	}

	const platform = (function(){
		let platform = argp.platform;
		
		if( !platform ){
			platform = 'android|an|8';
			
			utils.logWarn('No platform info specified! Default use: "'+ platform +'"');
		}
		
		platform = platform.split('|');
		
		return {
			name: platform[0],
			suffix: platform[1],
			code: platform[2]
		};
	})();
	
	utils.log('\n\n\n<------------ start make relative urls for: ' + platform.name + ' ------------>\n\n\n');
	
	const root = config.root + platform.name + '/';

	let	filesWithReplaces, filesWithImgReplaces;

	const calcFileDepthLevel = function(file){
		let rootDir = file.replace(/^.*?\/(gen|ggen)/, ''),
			upLevelCount = rootDir.split('/').length,
			urlUpLevel = '';
		
		while(--upLevelCount)
			urlUpLevel += '../';
		
		return urlUpLevel;
	};

	const replaceInFilesCSS = (function(){
		let text;
		
		return function(file){
			text = utils.readFile(file);
			
			text = text.replace(/url\((['"]*)\//g, 'url($1' + calcFileDepthLevel(file));
			
			utils.writeFile(file, text);
		};
	})();

	const replaceInFiles = (function(){
		let text,
			filePath,
			regExpExclude = new RegExp('/(const|gconst)'),
			dirDepthLevel = '../../../'; // Глубина вложенности файла main
		
		return function(file){
			filePath = file.replace(root, '');
			
			utils.logInline('file: ' + filePath);
			
			text = utils.readFile(file);
			
			// Пути до подключаемых файлов
			if( false ){
				//let dirDepthLevel = calcFileDepthLevel(file); // Считаем глубину вложенности файла
				
				text = text
						.replace(/(['"])\/((gen|ggen)\/.*?['"])/g, function(match, p1, p2){
							if( regExpExclude.test(match) )
								return match;
							else{
								if( !filesWithReplaces[filePath] )
									filesWithReplaces[filePath] = [];
								
								filesWithReplaces[filePath].push(match.replace(/['"]/g, '') + ' ----> ' + (p1 + dirDepthLevel + p2).replace(/['"]/g, ''));
								
								return p1 + dirDepthLevel + p2;
							}
						})
						.replace(/(cordova\.js)/g, dirDepthLevel + '$1');
			}
			else{
				text = text
						.replace(/\/((gen|ggen)\/[^'"]{5,}\..+?['"])/g, function(match, p1){
							if( regExpExclude.test(match) )
								return match;
							else{
								if( !filesWithReplaces[filePath] )
									filesWithReplaces[filePath] = [];
								
								filesWithReplaces[filePath].push(match.replace(/['"]$/, '') + ' ----> ' + p1.replace(/['"]$/, ''));
								
								return p1;
							}
						});
			}
			
			
			if( !config.srcWebPaths ){
				// Пути до изображений
				text = text
						.replace(/\/(img\/.*?['"])/g, function(match, p1){
							if( !filesWithImgReplaces[filePath] )
								filesWithImgReplaces[filePath] = [];
							
							filesWithImgReplaces[filePath].push(match.replace(/['"]$/, '') + ' ----> ' + p1.replace(/['"]$/, ''));
							
							return p1;
						});
			}
			
			utils.writeFile(file, text);	
		};
	})();

	const replaceImgInAllFiles = (function(){
		let text,
			filePath,
			regExpExclude = new RegExp('/(const|gconst)');
		
		return function(file){
			filePath = file.replace(root, '');
			
			utils.logInline('file: ' + filePath);
			
			text = utils.readFile(file);
			
			// Пути до изображений
			text = text.replace(/(['"(])(\/(img|snd)\/)/g, function(match, p1, p2){
				if( !filesWithImgReplaces[filePath] )
					filesWithImgReplaces[filePath] = [];
				
				let result = p1 + 'https://test.waysofhistory.com' + p2;
				
				filesWithImgReplaces[filePath].push(match + ' ----> ' + result);
				
				return result;
			});
			
			utils.writeFile(file, text);	
		};
	})();

	var srcDirs = [
		{dir: 'ggen/'},
		{dir: 'gen/'}
	]
	
	for(var srcDir in srcDirs){
		srcDir = srcDirs[srcDir];
		
		if( !utils.isDirExist(root + srcDir.dir) ){
			utils.logWarn('No sources folders for processing');
			
			return;
		}
	}
	
	for(var srcDir in srcDirs){
		srcDir = srcDirs[srcDir];
		
		try{
			srcDir.files = utils.getFiles(root + srcDir.dir);
		}
		catch(e){
			utils.logError(e);
		}
		
		filesWithReplaces = {};
		filesWithImgReplaces = {};
		
		utils.logInlineStart();

		for(var file in srcDir.files){
			file =  srcDir.files[file];
			
			if( config.srcWebPaths ){
				replaceInFiles(file);
				
				replaceImgInAllFiles(file);
			}
			else{
				if( /\/(css)\//.test(file) )
					replaceInFilesCSS(file);
				else
					replaceInFiles(file);
			}
		}

		utils.logInlineEnd();
		
		utils.writeLog(srcDir.dir.replace('/', '') +'_filesWithReplaces.txt', JSON.stringify(filesWithReplaces, undefined, 4));
		utils.writeLog(srcDir.dir.replace('/', '') +'_filesWithImgReplaces.txt', JSON.stringify(filesWithImgReplaces, undefined, 4));


		utils.log('<<< Files with replaces >>>');

		for(var fileWithReplace in filesWithReplaces){
			utils.log(fileWithReplace);
			
			fileWithReplace = filesWithReplaces[fileWithReplace];
			
			for(var replace in fileWithReplace){
				utils.log('    ' + fileWithReplace[replace]);
			};
		}

		for(var fileWithReplace in filesWithImgReplaces){
			utils.log(fileWithReplace);
			
			fileWithReplace = filesWithImgReplaces[fileWithReplace];
			
			for(var replace in fileWithReplace){
				utils.log('    ' + fileWithReplace[replace]);
			};
		}
	}
	
	utils.log('\n\n\n<------------ end make relative urls for: ' + platform.name + ' ------------>\n\n\n');
	
	//utils.terminateProcessAfterPress();
})();



