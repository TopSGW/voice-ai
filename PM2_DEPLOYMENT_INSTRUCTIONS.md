# Deploying Your Application with PM2 on Ubuntu Server

Follow these steps to deploy your application in daemon mode using PM2 on an Ubuntu server:

1. **Install Node.js and npm**
   If not already installed, run these commands:
   ```
   sudo apt update
   sudo apt install nodejs npm
   ```

2. **Install PM2 globally**
   ```
   sudo npm install -g pm2
   ```

3. **Clone your repository**
   ```
   git clone <your-repo-url>
   cd <your-project-directory>
   ```

4. **Install dependencies**
   ```
   npm install
   ```

5. **Create a PM2 ecosystem file**
   Create a file named `ecosystem.config.js` in your project root:
   ```javascript
   module.exports = {
     apps: [{
       name: "speech-to-text-ai",
       script: "npm",
       args: "run dev -- --host 0.0.0.0",
       env: {
         NODE_ENV: "production",
       },
       instances: "max",
       exec_mode: "cluster"
     }]
   }
   ```

6. **Start your application with PM2**
   ```
   pm2 start ecosystem.config.js
   ```

7. **Save the PM2 process list and set up startup script**
   ```
   pm2 save
   sudo pm2 startup systemd
   ```

8. **Check the status of your application**
   ```
   pm2 list
   pm2 monit
   ```

9. **View logs**
   ```
   pm2 logs speech-to-text-ai
   ```

10. **Restart the application (if needed)**
    ```
    pm2 restart speech-to-text-ai
    ```

11. **Stop the application (if needed)**
    ```
    pm2 stop speech-to-text-ai
    ```

Remember to configure your firewall to allow traffic on the port your application is using.

## Additional PM2 Commands

- Update PM2: `pm2 update`
- Reload all apps without downtime: `pm2 reload all`
- Stop and delete all apps: `pm2 delete all`

For more information, refer to the [PM2 documentation](https://pm2.keymetrics.io/docs/usage/quick-start/).