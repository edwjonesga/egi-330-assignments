import { firestore } from './firebase';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc
} from "firebase/firestore";

const templatesCollection = collection(firestore, 'prompt_templates');

export const templateService = {
  getTemplates: async () => {
    const snapshot = await getDocs(templatesCollection);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  },

  getTemplate: async (id) => {
    const docRef = doc(firestore, 'prompt_templates', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },

  createTemplate: async (template) => {
    const docRef = doc(firestore, 'prompt_templates', template.id);
    await setDoc(docRef, template);
    const docSnap = await getDoc(docRef);
    return { id: docSnap.id, ...docSnap.data() };
  },

  updateTemplate: async (id, template) => {
    const docRef = doc(firestore, 'prompt_templates', id);
    await updateDoc(docRef, template);
  },

  getTemplateFromUrl: () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }
};
