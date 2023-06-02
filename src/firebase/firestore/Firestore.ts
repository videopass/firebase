import { log } from '@videopass/services'
import { FirebaseApp } from 'firebase/app'
import {
	FirestoreSettings,
	initializeFirestore,
	addDoc,
	collection,
	Firestore,
	query,
	where,
	getDocs,
	OrderByDirection,
	orderBy,
	runTransaction,
	getDoc,
	doc,
	WhereFilterOp,
	setDoc,
	updateDoc,
	UpdateData,
} from 'firebase/firestore'

// https://cloud.google.com/docs/authentication/application-default-credentials
// https://firebase.google.com/docs/firestore/query-data/get-data
// web https://firebase.google.com/docs/reference/js/firestore_
// nodejs
// javascript https://firebase.google.com/docs/reference/js/v8/firebase.firestore

/**
 * const fb = new Firebase()
 * const db = new FirestoreDb(fb.app)
 */
export class FirestoreDb {
	app: FirebaseApp
	db: Firestore
	constructor(app: FirebaseApp) {
		const env = process.env.NODE_ENV
		this.app = app
		let firestoreSettings: FirestoreSettings = {}
		if (env === 'development') {
			firestoreSettings = { host: '127.0.0.1:8080', ssl: false }
		}
		this.db = initializeFirestore(app, firestoreSettings)
	}

	// https://firebase.google.com/docs/firestore/query-data/get-data#get_a_document
	async get(collectionName: string, id: string) {
		try {
			const docRef = await getDoc(doc(this.db, collectionName, id))
			log.debug(`Document written with ID: ${docRef.id}`)
		} catch (error) {
			log.error(error, `Error get document ${id} `)
			throw error
		}
	}

	async insert(collectionName: string, toInsert: any) {
		try {
			if (toInsert.id) {
				const docRef = doc(this.db, collectionName, toInsert.id)
				await setDoc(docRef, toInsert)
				log.debug(`Document written with ID: ${docRef.id}`)
			} else {
				const colRef = collection(this.db, collectionName)
				await addDoc(colRef, toInsert)
				log.debug(`Document written with ID: ${colRef.id}`)
			}
		} catch (error) {
			log.error(error, `Error adding document ${JSON.stringify(toInsert)} `)
			throw error
		}
	}

	// https://firebase.google.com/docs/reference/js/v8/firebase.firestore.DocumentReference#update
	async update(collectionName: string, toUpdate: any) {
		try {
			const docRef = doc(this.db, collectionName, toUpdate.id)
			await updateDoc(docRef, toUpdate, { merge: true })
			log.debug(`Document updated with ID: ${docRef.id}`)
		} catch (error) {
			log.error(error, `Error updating document ${JSON.stringify(toUpdate)} `)
			throw error
		}
	}

	// create a function to update a field with firestore
	// https://firebase.google.com/docs/firestore/manage-data/add-data#update-data
	async updateField(collectionName: string, id: string, field: string, value: any) {
		try {
			const docRef = doc(this.db, collectionName, id)
			await updateDoc(docRef, { [field]: value })
			log.debug(`Document fields ${field} updated with ID: ${docRef.id}`)
		} catch (error) {
			log.error(error, `Error updating field ${field} document ${JSON.stringify(id)} `)
			throw error
		}
	}

	async updateFields(collectionName: string, id: string, field: string, value: any, field2: string, value2: any) {
		try {
			const docRef = doc(this.db, collectionName, id)
			await updateDoc(docRef, { [field]: value, [field2]: value2 })
			log.debug(`Document fields ${field} & ${field2} updated with ID: ${docRef.id}`)
		} catch (error) {
			log.error(error, `Error updating field ${field} & ${field2} document ${JSON.stringify(id)} `)
			throw error
		}
	}

	async listBy<T>(collectionName: string, field: string, whereFilter: WhereFilterOp, value: string | number | boolean): Promise<T[]> {
		try {
			const colRef = collection(this.db, collectionName)
			const q = query(colRef, where(field, whereFilter, value))

			const data = await getDocs(q)
			if (data.empty) return []

			return data.docs.map((x: any) => ({ ...x.data() }))
		} catch (error) {
			log.error(error, `Error list ${collectionName} by ${field} with value ${value}`)
			throw error
		}
		return []
	}

	async list<T>(collectionName: string): Promise<T[]> {
		try {
			const colRef = collection(this.db, collectionName)

			const data = await getDocs(colRef)
			if (data.empty) return []

			return data.docs.map((x: any) => ({ ...x.data() }))
		} catch (error) {
			log.error(error, `Error list ${collectionName}`)
			throw error
		}
		return []
	}

	async listOrderBy<T>(collectionName: string, field: string, direction?: OrderByDirection): Promise<T[]> {
		try {
			const colRef = collection(this.db, collectionName)
			const q = query(colRef, orderBy(field, direction))

			const data = await getDocs(q)
			if (data.empty) return []

			return data.docs.map((x: any) => ({ ...x.data() }))
		} catch (error) {
			log.error(error, `Error list ${collectionName} order by ${field} with direction ${direction}`)
			throw error
		}
		return []
	}

	/**
	 * https://firebase.google.com/docs/firestore/manage-data/transactions#transactions
	 * Writes to the document referred to by the provided DocumentReference.
	 * If the document does not exist yet, it will be created.
	 * If you provide merge or mergeFields, the provided data can be merged into an existing document.
	 */
	async updateAll(collectionName: string, docs: any[]) {
		const options = { merge: true }

		try {
			//console.log(`insert ${chunks.length} chunks of ${chunks.map((x) => x.length)}`)
			for (const item of docs) {
				await runTransaction(this.db, async (transaction) => {
					let { id, ...rest } = item
					const docRef = doc(this.db, collectionName, item.id)
					const docFound = await transaction.get(docRef)

					if (docFound.exists()) transaction.update(docRef, rest)
				})
			}
		} catch (error) {
			console.error(`${error} during update many in collection ${collection}`)
		}
	}
}
