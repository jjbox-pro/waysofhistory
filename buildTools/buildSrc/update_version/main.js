const {utils} = require('jjbox-utils');

let 
    package_version,
    project_version,
    error = (function(){
        console.clear();
        
        const     argv = utils.prepareArgv(process.argv),
                argp = utils.prepareArgp(argv);
        
        utils.log('\n\n\n<------------ Start updating version ------------>\n');
        
        // Обновляем версию сборки на 1
        
        let file = '../../../config.xml',
            text = utils.readFile(file);
        
        
        text = text.replace(/(<widget .+? project_version=")(.+?)(")/, function(match, p1, p2, p3){
            p2 = p2.split('.');
            p2[p2.length-1] = ++p2[p2.length-1];
            project_version = p2.join('.');
            
            package_version = p2.pop();
            package_version = p2.join('.') + '' + package_version;
            
            return p1 + project_version + p3;
        });
        
        text = text.replace(/(<widget .+? version=")(.*?)(")/, function(match, p1, p2, p3){
            return p1 + package_version + p3;
        });
        
        utils.writeFile(file, text);
        
        
        file = '../../../package.json',
        text = utils.readFile(file);
        
        text = text.replace(/(['"]version['"]: ['"])(.+?)(['"])/, function(match, p1, p2, p3){
            return p1 + package_version + p3;
        });
        
        utils.writeFile(file, text);
        
        
        file = '../../../www/launcher.html',
        text = utils.readFile(file);
        
        text = text.replace(/(build version: )(.+?)(<)/, function(match, p1, p2, p3){
            return p1 + project_version + p3;
        });
        
        utils.writeFile(file, text);
        
        return 0;
    })();


if( !error )
    utils.log('\n\n\n<------------ Updating version done. Current version: ' + project_version + ' ------------>\n');
else{
    utils.logError(error);
    
    //utils.terminateProcessAfterPress();
}

    
