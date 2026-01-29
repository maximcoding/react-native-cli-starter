1. Name: build
   Command: npm run build

2. Name: cli help
   Command: npm run cli -- --help

3. Name: doctor env
   Command: npm run cli -- doctor --env

4. Name: doctor project
   Command: npm run cli -- doctor

5. Name: smoke init expo
   Command: npm run cli -- init MyApp --target expo --lang ts --pm pnpm

6. Name: smoke init bare
   Command: npm run cli -- init MyApp --target bare --lang ts --pm pnpm --platforms ios,android

7. Name: init all options (test)
   Command: npm run cli -- init TestAll
   Note: In the first prompt "Select features to include", choose "Select all (testing only)" to select every option for testing. Installs many deps in batches.

