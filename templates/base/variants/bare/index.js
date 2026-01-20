/**
 * FILE: index.js
 * PURPOSE: Bare RN entrypoint. Ensures react-native-gesture-handler is initialized.
 * OWNERSHIP: CLI (root file)
 */
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';

import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

