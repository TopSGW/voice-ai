# Deploying Your Built Vite Application with PM2 on Ubuntu Server

This guide will help you deploy your built Vite application using PM2 on an Ubuntu server. These instructions are tailored for beginners who are new to Vite and deployment processes.

## Prerequisites

- A Vite application that has been built locally
- An Ubuntu server with SSH access
- Basic knowledge of command-line operations

## Deployment Steps

1. **Build Your Vite Application Locally**
   Before deploying, build your application on your local machine:
   ```
   npm run build
   ```
   This will create a `dist` folder with your built application. The `dist` folder contains static files (HTML, CSS, JavaScript) that can be served directly by a web server.

2. **Install Node.js and npm on Your Ubuntu Server**
   Connect to your server via SSH and run these commands:
   ```
   sudo apt update
   sudo apt install nodejs npm
   ```

3. **Install PM2 Globally on Your Server**
   PM2 is a process manager for Node.js applications. Install it with:
   ```
   sudo npm install -g pm2
   ```

4. **Transfer Your Built Application to the Server**
   Use SCP, SFTP, or any other method to transfer the `dist` folder to your server. For example, using SCP:
   ```
   scp -r ./dist user@your-server-ip:/path/to/your/app
   ```

5. **Install a Static File Server on Your Server**
   We'll use `serve` to host the static files. Install it globally:
   ```
   sudo npm install -g serve
   ```

6. **Create a PM2 Ecosystem File on Your Server**
   In the same directory as your `dist` folder, create a file named `ecosystem.config.js`:
   ```javascript
   module.exports = {
     apps: [{
       name: "vite-app",
       script: "serve",
       env: {
         PM2_SERVE_PATH: './dist',
         PM2_SERVE_PORT: 8080,
         PM2_SERVE_SPA: 'true',
         PM2_SERVE_HOMEPAGE: '/index.html'
       }
     }]
   }
   ```
   This configuration tells PM2 to use `serve` to host your `dist` folder on port 8080.

7. **Start Your Application with PM2**
   In the directory containing `ecosystem.config.js` and the `dist` folder, run:
   ```
   pm2 start ecosystem.config.js
   ```

8. **Save the PM2 Process List and Set Up Startup Script**
   This ensures your app starts automatically if the server reboots:
   ```
   pm2 save
   sudo pm2 startup systemd
   ```

9. **Check the Status of Your Application**
   ```
   pm2 list
   pm2 monit
   ```

10. **View Logs**
    ```
    pm2 logs vite-app
    ```

## Important Considerations

1. **Firewall Configuration**: Ensure your firewall allows traffic on the port you've specified (e.g., 8080).

2. **Reverse Proxy**: For better security and performance, consider setting up Nginx as a reverse proxy in front of your application.

3. **HTTPS**: For production, set up HTTPS using a service like Let's Encrypt.

4. **Environment Variables**: If your app uses environment variables, make sure they're properly set in your production environment.

5. **API Backend**: If your Vite app communicates with a backend API, ensure it's properly configured to point to your production API server.

## Updating Your Application

To update your application after making changes:

1. Build your application locally: `npm run build`
2. Transfer the new `dist` folder to your server
3. Restart your PM2 process: `pm2 restart vite-app`

## Troubleshooting Common Issues

1. **Application not accessible**: 
   - Check if the correct port is open in your firewall
   - Ensure the `PM2_SERVE_PORT` in `ecosystem.config.js` matches the port you're trying to access

2. **Blank page or 404 errors**: 
   - Verify that `PM2_SERVE_SPA` is set to 'true' in `ecosystem.config.js`
   - Check if `PM2_SERVE_HOMEPAGE` is correctly set to '/index.html'

3. **Changes not reflected after update**: 
   - Make sure you've replaced the entire `dist` folder with the new build
   - Clear your browser cache or try in an incognito window

4. **PM2 process not starting**: 
   - Check PM2 logs: `pm2 logs vite-app`
   - Ensure Node.js and PM2 are correctly installed and up to date

5. **Assets not loading**: 
   - Check if your Vite configuration uses the correct base path
   - Verify that all assets are correctly referenced in your code

Remember, if you encounter any issues not covered here, the PM2 and Vite documentation are excellent resources for troubleshooting.

## Additional PM2 Commands

- Update PM2: `pm2 update`
- Reload all apps without downtime: `pm2 reload all`
- Stop and delete all apps: `pm2 delete all`

For more information, refer to the [PM2 documentation](https://pm2.keymetrics.io/docs/usage/quick-start/) and [Vite deployment guide](https://vitejs.dev/guide/static-deploy.html).

Remember to thoroughly test your application in a staging environment that mirrors your production setup before deploying to the actual production server. Good luck with your deployment!