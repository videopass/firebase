import { log } from '@videopass/services'
import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app'

const env = process.env.NODE_ENV
if (env === 'development') {
	log.debug('debug mode')
} else {
	log.debug('production mode')
}

// firebase app config only
const defaultFirebaseConfig = {
	apiKey: process.env.REACT_APP_API_KEY,
	authDomain: process.env.REACT_APP_AUTH_DOMAIN,
	databaseURL: process.env.REACT_APP_DATABASE_URL,
	projectId: process.env.REACT_APP_PROJECT_ID,
	storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
	messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
	appId: process.env.REACT_APP_APP_ID,
}

export class Firebase {
	app: FirebaseApp
	constructor(firebaseConfig: FirebaseOptions = defaultFirebaseConfig) {
		log.debug(firebaseConfig)
		this.app = initializeApp(firebaseConfig)
	}
}
