const {utils} = require('jjbox-utils');

let 	platform,
		error = (function(){
			console.clear();
			
			const 	argv = utils.prepareArgv(process.argv),
					argp = utils.prepareArgp(argv);
			
			let config;
			
			try{
				config = JSON.parse(utils.readFile('config.json'));
			}
			catch(e){
				utils.logError('Error parse config.json file!');
				
				return e;
			}
			
			platform = (function(){
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
			
			utils.log('\n\n\n<------------ Start build sources for: ' + platform.name + ' ------------>\n');
			
			
			
			
			
			const 	pathSrc = config.pathSrc + config.folderSrc.replace('<platformCode>', platform.code) + '/',
					pathOutput = config.pathOutput + platform.name + '/';
			
			if( !utils.isDirExist(pathSrc) ){
				utils.logWarn('No sources folder ' + '"' + pathSrc + '"' + ' for platform: ' + platform.name);
				
				return 0;
			}
			
			var srcDirs = [
				{dir: 'ggen/', lang: '(' + config.lang + ')', included: '(html)'},
				{dir: 'gen/', lang: '(' + config.lang + ')', included: '(html|js/(ru|de|en)/mobile|js/(ru|de|en)/mobileApp)'}
			]
			
			utils.makeDir(pathOutput);
			
			for(var srcDir in srcDirs){
				srcDir = srcDirs[srcDir];
				
				utils.removeDir(pathOutput+srcDir.dir);
				
				srcDir.files = [];
				
				try{
					srcDir.files = utils.getFiles(pathSrc+srcDir.dir);
				}
				catch(e){
					utils.logWarn(e);
				}
				
				if( !srcDir.files.length )
					continue;
				
				utils.log('>>> dir: ' + srcDir.dir + ' <<<');
				
				var usedFiles = [], text, 
					regExp = new RegExp('[\'"/]'+ srcDir.dir +'[^\'"]+?\\..+?[\'"]', 'g'),
					regExpLang = new RegExp('/'+ srcDir.lang +'/'),
					regExpFileVersion = new RegExp('_[\\d]+?\\.[^.]+$'),
					regExpIncluded = new RegExp('[\'"/]'+ srcDir.dir +'.*' + srcDir.included + '.*', 'g'),
					emptyArr = [],
					filesArr = [];
				
				for(var file in srcDir.files){
					file =  srcDir.files[file];
					
					if( !regExpLang.test(file) )
						continue;
					
					usedFiles = usedFiles.concat(file.match(regExpIncluded)||emptyArr);
					
					if( !regExpFileVersion.test(file) )
						continue;
					
					filesArr.push(file.replace(pathSrc, ''));
					
					utils.log('file: ' + file);
					
					text = utils.readFile(file);
					
					usedFiles = usedFiles.concat(text.match(regExp)||emptyArr);	
				}
				
				utils.writeLog(srcDir.dir.replace('/', '') +'_processedFiles.txt', filesArr.join('\n'));
				
				var dirs = [], curDir, fileName;
				
				filesArr = [];
				
				utils.log('>>> usedFiles <<<');
				
				for(var usedFile in usedFiles){
					usedFile = usedFiles[usedFile].replace(/^[\'"/]/, '').replace(/\?.*/, '').replace(/['"]$/, '');
					
					dirs = usedFile.split('/');
					
					fileName = dirs.pop(); // Получаем имя файла
					
					if( !regExpFileVersion.test(fileName) )
						continue;
					
					curDir = '';
					
					for(var dir in dirs){
						curDir += dirs[dir];
						
						utils.makeDir(pathOutput + curDir);
						
						curDir += '/';
					}
					
					filesArr.push(usedFile);
					
					utils.log('File copied: ' + usedFile);
					
					utils.copyFile(pathSrc + usedFile, pathOutput + usedFile);
				}
				
				utils.writeLog(srcDir.dir.replace('/', '') +'_usedFiles.txt', filesArr.join('\n'));
			}
			
			
            
                                                                                                        
                                                                                                        
			if( !argp.noResources ){
                let resources = {
                        images: {
                            dir: 'img/',
                            regExpIncluded: /img\/(buildings2|gui|gui_mobile|help|map1|map2|town2|glagna|fonts|mobile)/,
                            regExpExcluded: /(town2\/houses|map1\/climate-50-2|map1\/climate-100-2|map1\/improvement-50-2|map1\/improvement-100-2)/,
                        },
                        sounds: {
                            dir: 'snd/',
                            regExpIncluded: false,
                            regExpExcluded: false,
                        }
                    },
                    resType,
                    res;
                
                for(resType in resources){
                    utils.log('>>>>>>>>>>>>>>>>>>>>>>>>> ' + resType + ' extracting >>>>>>>>>>>>>>>>>>>>>>>>>');
                    
                    res = resources[resType];
                    
                    utils.copyDir(pathSrc + res.dir, pathOutput + res.dir, {
                        filter: function(fileOrDir, info){
                            if( !info.isDir )
                                return true;
                            
                            if( !(!res.regExpIncluded || res.regExpIncluded.test(fileOrDir)) || (res.regExpExcluded && res.regExpExcluded.test(fileOrDir)) )
                                return false;
                            
                            utils.log(fileOrDir);
                            
                            return true;
                        }
                    });
                }
			}
			
			return 0;
		})();



if( !error )
	utils.log('\n\n\n<------------ End build sources for: ' + platform.name + ' ------------>\n');
else{
	utils.logError(error);
	
	//utils.terminateProcessAfterPress();
}

