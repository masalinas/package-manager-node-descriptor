const commandLineArgs = require('command-line-args');
const shell = require('shelljs');
const cliProgress = require('cli-progress');
const colors = require('ansi-colors');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const optionDefinitions = [
    { name: 'package', alias: 'p', type: String }
]

const options = commandLineArgs(optionDefinitions)

// create a new progress bar instance and use shades_classic theme
const bar = new cliProgress.SingleBar({
    format: 'Descriptor Progress |' + colors.cyan('{bar}') + '| {percentage}% || {value}/{total} Chunks || Speed: {speed}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
});

// congigure csv createCsvWriter
const csvWriter = createCsvWriter({
    path: 'bi-immucor-ui.csv',
    header: [
        {id: 'name', title: 'name'},
        {id: 'version', title: 'version'},
        {id: 'description', title: 'description'},
        {id: 'license', title: 'license'}
    ]
});

// intialize deep dependencies number
let dependencyCount = 0;
let dependencies = [];

// dependency recursive counter and descriptor
function dependencyCounter(data) {
    if(data.dependencies) {
        for (keyDependency in data.dependencies) {
            dependencyCount = dependencyCount + 1;

            dependencyCounter(data.dependencies[keyDependency]);
        }
    }
}

function dependencyDescriptor(data) {
    if(data.dependencies) {
        for (keyDependency in data.dependencies) {
            let name = keyDependency;
            let version = data.dependencies[keyDependency].version;
            let resolved = data.dependencies[keyDependency].resolved;

            let result = shell.exec("npm view " + name + " --json");
            let dependency = JSON.parse(result.stdout);
            let description = dependency.description;
            let license = dependency.license;
            let maintainers = dependency.maintainers;

            console.log('Name: ' + name + ", Version: " + version + ", Description: " + description + ", license: " + license + ", maintainers: " + maintainers);

            dependencies.push({
                name: name,
                version: version,
                description: description,
                license: license,
                maintainers: maintainers
            });

            bar.increment();

            dependencyDescriptor(data.dependencies[keyDependency]);
        }
    }
}

// STEP01: recover all dependencies
let result = shell.exec('npm list --all --json');

// STEP02: parse dependency result
//if (result.stderr === '') {
  // parse dependency results
  result = JSON.parse(result.stdout);

  // calculate deep dependencies and start progress bar
  dependencyCounter(result);

  bar.start(dependencyCount, 0);

  // parse dependencies
  dependencyDescriptor(result);

  // stop progress bar
  bar.stop();

  console.log(dependencies);

  // export csv file from dependencies
  csvWriter.writeRecords(dependencies)
    .then(() => {
        console.log('... CSV Exported correctly');
    });
//}
