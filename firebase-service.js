// Firebase Service Integration for Aromatica
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    signInWithPopup, 
    GoogleAuthProvider, 
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    collection, 
    query, 
    where, 
    getDocFromServer,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Load configuration details from firebase-applet-config.json
const firebaseConfig = {
    projectId: "aromatica-503518",
    appId: "1:225624696225:web:59bb163dd2e244df19d7e0",
    apiKey: "AIzaSyBRTYAWDJ-4zWphGTn0P-ckegYGYwV47o8",
    authDomain: "aromatica-503518.firebaseapp.com",
    firestoreDatabaseId: "ai-studio-feeprojectaromat-bf0831a4-bcc0-4f32-94fd-e47d00b4ec45",
    storageBucket: "aromatica-503518.firebasestorage.app",
    messagingSenderId: "225624696225",
    measurementId: "",
    oAuthClientId: "225624696225-n9knul0b2r965m691cuu0at4l5kr5fqb.apps.googleusercontent.com",
    recaptchaSiteKey: ""
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Test Connection on initial boot as mandated by the Firebase Integration Skill
async function testConnection() {
    try {
        await getDocFromServer(doc(db, "test", "connection"));
    } catch (error) {
        if (error instanceof Error && error.message.includes("the client is offline")) {
            console.error("Please check your Firebase configuration. Client is offline.");
        }
    }
}
testConnection();

// --- Error Handlers (MANDATORY STRUCTURE) ---
export const OperationType = {
    CREATE: "create",
    UPDATE: "update",
    DELETE: "delete",
    LIST: "list",
    GET: "get",
    WRITE: "write",
};

export function handleFirestoreError(error, operationType, path) {
    const errInfo = {
        error: error instanceof Error ? error.message : String(error),
        authInfo: {
            userId: auth.currentUser?.uid || null,
            email: auth.currentUser?.email || null,
            emailVerified: auth.currentUser?.emailVerified || null,
            isAnonymous: auth.currentUser?.isAnonymous || null,
            tenantId: auth.currentUser?.tenantId || null,
            providerInfo: auth.currentUser?.providerData?.map(provider => ({
                providerId: provider.providerId,
                email: provider.email,
            })) || []
        },
        operationType,
        path
    };
    console.error("Firestore Error: ", JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
}

// --- Auth APIs ---
export async function signUpWithEmail(name, email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: name });
        
        // Create user profile in Firestore
        const path = `users/${user.uid}`;
        try {
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                createdAt: new Date().toISOString()
            });
        } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, path);
        }
        
        return user;
    } catch (error) {
        console.error("Signup error:", error);
        throw error;
    }
}

export async function loginWithEmail(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
}

export async function loginWithGooglePopup() {
    try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;

        // Create or update user profile in Firestore
        const path = `users/${user.uid}`;
        try {
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: user.displayName || "Google User",
                email: user.email,
                createdAt: new Date().toISOString()
            });
        } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, path);
        }

        return user;
    } catch (error) {
        console.error("Google login error:", error);
        throw error;
    }
}

export async function logoutUser() {
    try {
        await signOut(auth);
        localStorage.removeItem("aromatica_current_user");
    } catch (error) {
        console.error("Signout error:", error);
        throw error;
    }
}

// --- Firestore Business Operations ---

export async function createReservation(resObj) {
    if (!auth.currentUser) throw new Error("Authentication required to reserve a table.");
    
    const docId = resObj.ref;
    const path = `reservations/${docId}`;
    try {
        const payload = {
            ref: resObj.ref,
            userId: auth.currentUser.uid,
            outlet: resObj.outlet,
            table: resObj.table,
            date: resObj.date,
            time: resObj.time,
            guests: resObj.guests,
            bookedAt: resObj.bookedAt,
            status: "Confirmed"
        };
        await setDoc(doc(db, "reservations", docId), payload);
        return payload;
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
    }
}

export async function createOrder(orderObj) {
    if (!auth.currentUser) throw new Error("Authentication required to place an order.");
    
    const docId = orderObj.id;
    const path = `orders/${docId}`;
    try {
        const payload = {
            id: orderObj.id,
            userId: auth.currentUser.uid,
            date: orderObj.date,
            items: orderObj.items.map(i => ({
                id: i.id,
                name: i.name,
                price: Number(i.price),
                quantity: Number(i.quantity)
            })),
            total: Number(orderObj.total),
            status: "Preparing"
        };
        await setDoc(doc(db, "orders", docId), payload);
        return payload;
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
    }
}

export async function createInquiry(inquiryObj) {
    const randomId = "INQ-" + Math.floor(Math.random() * 900000 + 100000);
    const path = `contact_inquiries/${randomId}`;
    try {
        const payload = {
            name: inquiryObj.name,
            email: inquiryObj.email,
            subject: inquiryObj.subject,
            message: inquiryObj.message,
            submittedAt: new Date().toISOString()
        };
        await setDoc(doc(db, "contact_inquiries", randomId), payload);
        return payload;
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
    }
}

export async function fetchUserReservations() {
    if (!auth.currentUser) return [];
    const path = "reservations";
    try {
        const q = query(
            collection(db, "reservations"), 
            where("userId", "==", auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((doc) => {
            list.push(doc.data());
        });
        return list;
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
    }
}

export async function fetchUserOrders() {
    if (!auth.currentUser) return [];
    const path = "orders";
    try {
        const q = query(
            collection(db, "orders"), 
            where("userId", "==", auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((doc) => {
            list.push(doc.data());
        });
        return list;
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
    }
}

// --- Sync state to window and localStorage ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        const profile = {
            uid: user.uid,
            name: user.displayName || user.email.split("@")[0],
            email: user.email,
            emailVerified: user.emailVerified
        };
        localStorage.setItem("aromatica_current_user", JSON.stringify(profile));
    } else {
        localStorage.removeItem("aromatica_current_user");
    }
    
    // Dispatch custom event to let other scripts know auth has changed
    window.dispatchEvent(new CustomEvent("aromatica-auth-changed", { detail: user }));
});

// Export globally
window.firebaseService = {
    auth,
    db,
    signUpWithEmail,
    loginWithEmail,
    loginWithGooglePopup,
    logoutUser,
    createReservation,
    createOrder,
    createInquiry,
    fetchUserReservations,
    fetchUserOrders
};
