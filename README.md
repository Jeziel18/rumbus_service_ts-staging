# RUMBus Service

## Contributing to  this API

1. Clone this project.
2. Make sure you have [npm](https://www.npmjs.org/) installed globally. (You should have this if you have node installed).
3. Install [yarn](https://yarnpkg.com/en/docs/getting-started).

## Developing with [Docker](https://docs.docker.com/get-started/) containers
1. Follow the installation instructions for your OS from the [Docker website](https://docs.docker.com/get-started/#install-docker-desktop)
* Sidenote: For windows it requires you to have Microsoft Windows 10 (Professional or Enterprise 64-bit), or Windows 10 Update 2004 with WSL2.
2. On the terminal run the following commands:
   >`cd "project-directory"`
- And then to start the development server listening to file changes:
   >`docker-compose -f docker-compose.dev.yml up`

### To run the test suites:
   >`docker-compose -f docker-compose.test.yml up`

### To access the APM server information using Kibana:
 > http://localhost:5601

## Keep in mind (Rules):
- Make your own branch when working on this project. It can be by either feature being worked on or by contributor. **DO NOT WORK DIRECTLY ON MASTER!**

- Any changes made, make sure you have the latest version of the code in the repository with a `git pull` **before** trying to do a merge. *Especially* merging with the **master** branch. This is so to prevent conflicts. 
- Make sure the commit comment on your code is clear on the changes made. (See this ["guide"](https://chris.beams.io/posts/git-commit/))

One last suggestion, install [**nodemon**](https://nodemon.io/) globally and then run `nodemon [your node app]`. Nodemon is a tool that helps develop node.js based applications by automatically restarting the node application when file changes in the directory are detected.

## Troubleshooting:
### DOCKER:
- Resetting the volumes can help with errors related to the persistent storage and bad storage management.
> `docker-compose -v down`
- When running the containers, sometimes it may not update the image with the latest .ts file changes, or when changing configuration files (although uncommon, it can happen). A way around it is rebuilding the image and recreating the containers. Adding this to the `docker-compose up` command
> `--force-recreate`
- You can access the logs from a specific container using:
> `docker logs [container name]` 
### GENERAL:
- If you are not running a current version of the rumbus-service, some files might be missing, verify the _master branch_ /config folder for development. Verify you have the correct configuration files in the `/scr/configs` 
- Compiling TS files in `/src` to JS in `/dist`
> `yarn run build-ts`

- You can also look up the [Yarn NPM "cheat sheet"](https://devhints.io/yarn)
---
- Although rare, in some unlikely cases, the "End of Line Sequence" in some files (like bash command files) get mixed up depending the settings and environment of the developers. This generates behaviors like:
   - Permission problems when trying to run a unix command in a container.
   - ``{
    "code": "InternalServer",
    "message": "ResourceNotFoundException"}``
   - Amongst others.

- This can be fixed by changing the "End of Line Sequence" of the corresponding files to ``LF``.
## API Documentation at: https://rumbus.gitlab.io/rumbus_service_ts
### *DevServer (API Heroku): https://rumbus-staging-api.herokuapp.com/
*This server deploys with the staging branch.