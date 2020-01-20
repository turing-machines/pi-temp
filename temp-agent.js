// Node Temperature Monitoring agent
// Declarations
const express = require('express');
const pretty = require('express-prettify');
const exec = require('child_process').exec;
const rp = require('request-promise');
const moment = require('moment');
const app = express();
const port = 5000;
const route_404 = '404 - Page not found';
app.use(pretty({ query: 'pretty' }));
// Execute shell command
function sh_exec(command) {
    return new Promise((resolve, reject) => {
     exec(command, (error, stdout, stderr) => {
         if (error) console.warn(error);
         if (stderr) {
            console.warn(stderr);
            resolve("");
         }
         else resolve(stdout);
        });
    }); 
}
// API route for getting temperature of individual node
app.get('/api/get-node-temp', async (_req, resp) => {
    var podName =  (await sh_exec('hostname')).trim();
    var nodeName = (process.env.MY_NODE_NAME);
    var temperature = (await sh_exec('cat /sys/class/thermal/thermal_zone0/temp')).trim() / 1000;
    var dateUpdated = moment().format("DD-MM-YYYY, HH:mm:ss");
    resp.json({nodeName, podName, temperature, dateUpdated});
});
// API route for getting temperature of the cluster
app.get('/api/get-cluster-temp', async (req, resp) => {
    var podIpList = (await sh_exec("kubectl get pods -n pi-temp -o wide 2>/dev/null | grep pi-temp | awk '{print $6}'")).split("\n");
    var podIpList = podIpList.filter((item) => { return item.trim() != '' });
    var result = [];
for (let i = 0; i < podIpList.length; i++){
        await rp(`http://${podIpList[i]}:5000/api/get-node-temp`).then(body => {
            result.push(JSON.parse(body));
        }).catch(err => {
            console.log(err);
        });
    }
resp.json(result);
});
// All other routes return 404
app.get('*', function(_req, res){
    res.status(404).send(route_404);
  });
// Start listening
app.listen(port, () => console.log(`TemperatureAgent listening on port ${port}!`));
