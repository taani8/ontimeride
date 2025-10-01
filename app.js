// وظائف إدارة السائقين والرحلات

// 3. وظيفة حساب العمولة وتحديث الرصيد
async function addTripAndUpdateBalance(formData) {
    if (!db) {
        alertUser("قاعدة البيانات غير متوفرة. يُرجى التحقق من خطأ التهيئة.");
        return;
    }

// تعديل رحلة موجودة وتحديث رصيد السائق حسب الفرق في العمولة
async function editTrip(tripId) {
    if (!db) { alertUser('قاعدة البيانات غير متوفرة.'); return; }
    if (!tripId) { alertUser('معرف الرحلة غير صالح.'); return; }
    try {
        const tripRef = doc(db, getCollectionPath('trips'), tripId);
        const snap = await getDoc(tripRef);
        if (!snap.exists()) { alertUser('الرحلة غير موجودة.'); return; }
        const trip = snap.data();
        // افتح مودال التعديل واملأ الحقول
        const modal = document.getElementById('edit-trip-modal');
        if (!modal) { alertUser('واجهة التعديل غير جاهزة.', 'error'); return; }
        document.getElementById('edit-trip-id').value = tripId;
        document.getElementById('edit-trip-total').value = trip.totalPrice ?? '';
        document.getElementById('edit-trip-type').value = (trip.tripType || 'passengers');
        modal.classList.remove('hidden');
    } catch (e) {
        console.error('editTrip error', e);
        alertUser(e.message || 'فشل تعديل الرحلة');
    }
}

async function applyEditTrip(tripId, newTotal, newType) {
    if (!db) { alertUser('قاعدة البيانات غير متوفرة.'); return; }
    const tripRef = doc(db, getCollectionPath('trips'), tripId);
    await runTransaction(db, async (transaction) => {
        const tSnap = await transaction.get(tripRef);
        if (!tSnap.exists()) throw new Error('الرحلة غير موجودة');
        const tData = tSnap.data();
        const driverRef = doc(db, getCollectionPath('drivers'), tData.driverId);
        const dSnap = await transaction.get(driverRef);
        if (!dSnap.exists()) throw new Error('السائق غير موجود');
        const d = dSnap.data();

        const commissionType = tData.commissionType || d.commissionType || 'value';
        const commissionValue = tData.commissionValue !== undefined ? tData.commissionValue : (parseFloat(d.commissionValue) || 0);
        let newCommission = 0;
        if (commissionType === 'percent') newCommission = newTotal * (commissionValue / 100);
        else newCommission = commissionValue;
        newCommission = Math.round(newCommission * 100) / 100;

        const oldCommission = Math.round((tData.commissionAmount || 0) * 100) / 100;
        const delta = newCommission - oldCommission;
        const newBalance = Math.round(((d.balance || 0) - delta) * 100) / 100;

        transaction.update(tripRef, {
            totalPrice: newTotal,
            tripType: newType,
            commissionAmount: newCommission,
            updated_at: new Date().toISOString()
        });
        transaction.update(driverRef, { balance: newBalance, updated_at: new Date().toISOString() });
    });
    alertUser('تم تعديل الرحلة بنجاح', 'success');
}

// حذف رحلة مع عكس تأثير العمولة على رصيد السائق
async function deleteTrip(tripId) {
    if (!db) { alertUser('قاعدة البيانات غير متوفرة.'); return; }
    if (!tripId) { alertUser('معرف الرحلة غير صالح.'); return; }
    // افتح مودال التأكيد
    const modal = document.getElementById('delete-trip-modal');
    if (!modal) { alertUser('واجهة الحذف غير جاهزة.', 'error'); return; }
    document.getElementById('delete-trip-id').value = tripId;
    modal.classList.remove('hidden');
}

async function applyDeleteTrip(tripId) {
    const tripRef = doc(db, getCollectionPath('trips'), tripId);
    await runTransaction(db, async (transaction) => {
        const tSnap = await transaction.get(tripRef);
        if (!tSnap.exists()) throw new Error('الرحلة غير موجودة');
        const t = tSnap.data();
        const driverRef = doc(db, getCollectionPath('drivers'), t.driverId);
        const dSnap = await transaction.get(driverRef);
        if (!dSnap.exists()) throw new Error('السائق غير موجود');
        const d = dSnap.data();

        const restore = Math.round((t.commissionAmount || 0) * 100) / 100;
        const newBalance = Math.round(((d.balance || 0) + restore) * 100) / 100;

        transaction.delete(tripRef);
        transaction.update(driverRef, { balance: newBalance, updated_at: new Date().toISOString() });
    });
    alertUser('تم حذف الرحلة وعكس العمولة بنجاح', 'success');
}

// 7. تصدير CSV
function exportDriversCSV(drivers) {
    const headers = ['id','name','phoneNumber','balance','commissionType','commissionValue','created_at'];
    const rows = drivers.map(d => [
        d.id,
        wrapCsv(d.name),
        wrapCsv(d.phoneNumber),
        (d.balance ?? 0),
        d.commissionType || 'value',
        d.commissionValue ?? 0,
        d.created_at || ''
    ]);
    downloadCSV([headers, ...rows], `drivers-${new Date().toISOString().slice(0,10)}.csv`);
}

function exportTripsCSV(trips) {
    const headers = ['id','driverId','totalPrice','tripType','commissionType','commissionValue','commissionAmount','dateAdded','addedBy'];
    const rows = trips.map(t => [
        t.id || '',
        t.driverId || '',
        t.totalPrice ?? 0,
        t.tripType || '',
        t.commissionType || '',
        t.commissionValue ?? '',
        t.commissionAmount ?? '',
        t.dateAdded || '',
        t.addedBy || ''
    ]);
    downloadCSV([headers, ...rows], `trips-${new Date().toISOString().slice(0,10)}.csv`);
}

function downloadCSV(rows, filename) {
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function wrapCsv(value) {
    if (value === undefined || value === null) return '';
    const s = String(value).replace(/"/g, '""');
    if (/[,"]/.test(s)) return `"${s}"`;
    return s;
}

    const tripData = {
        driverId: formData.driverId,
        totalPrice: parseFloat(formData.totalPrice),
        // سيتم تحديد نوع وقيمة العمولة لاحقاً بناءً على إعدادات السائق إن لم تُمرر
        commissionType: undefined,
        commissionValue: formData.commissionValue !== '' && formData.commissionValue !== undefined ? parseFloat(formData.commissionValue) : undefined,
        tripType: formData.tripType, 
        dateAdded: new Date().toISOString(),
        addedBy: userId
    };

    const driverRef = doc(db, getCollectionPath('drivers'), tripData.driverId);
    const tripCollectionRef = collection(db, getCollectionPath('trips'));

    if (isNaN(tripData.totalPrice)) {
        alertUser("الرجاء إدخال قيمة رقمية صحيحة للسعر الإجمالي.");
        return;
    }

    try {
        await runTransaction(db, async (transaction) => {
            const driverDoc = await transaction.get(driverRef);
            if (!driverDoc.exists()) {
                throw new Error("السائق غير موجود في قاعدة البيانات!");
            }

            const d = driverDoc.data();
            // تحديد نوع وقيمة العمولة: أولوية لمدخل النموذج، ثم إعداد السائق، وإلا 0 ثابت
            const commissionType = tripData.commissionValue !== undefined ? 'value' : (d.commissionType || 'value');
            const commissionValue = tripData.commissionValue !== undefined ? tripData.commissionValue : (parseFloat(d.commissionValue) || 0);

            let commissionAmount = 0;
            if (commissionType === 'percent') {
                commissionAmount = (tripData.totalPrice || 0) * (commissionValue / 100);
            } else {
                commissionAmount = commissionValue;
            }
            commissionAmount = Math.round(commissionAmount * 100) / 100;

            tripData.commissionType = commissionType;
            tripData.commissionValue = commissionValue;
            tripData.commissionAmount = commissionAmount;

            const newBalance = (d.balance || 0) - commissionAmount; 
            
            transaction.set(doc(tripCollectionRef), tripData);
            transaction.update(driverRef, { balance: newBalance });
        });

        alertUser(`تم إضافة الرحلة بنجاح!`);
        const tripFormEl = document.getElementById('add-trip-form');
        if (tripFormEl) tripFormEl.reset();

    } catch (error) {
        console.error("خطأ في تنفيذ المعاملة (الرحلة/الرصيد): ", error);
        alertUser(`فشل إضافة الرحلة: ${error.message || error}`);
    }
}

// 4. وظيفة إضافة سائق جديد 
async function addDriver(formData) {
    if (!db) {
        alertUser("قاعدة البيانات غير متوفرة. يُرجى التحقق من خطأ التهيئة.");
        return;
    }
    
    const initialBalance = parseFloat(formData.initialBalance) || 0;
    
    // تنظيف رقم الهاتف من المسافات والرموز
    const cleanPhoneNumber = formData.phoneNumber.replace(/\s+/g, '').replace(/[^\d]/g, '');
    
    if (!cleanPhoneNumber || cleanPhoneNumber.length < 10) {
        alertUser("رقم الهاتف غير صحيح. يجب أن يحتوي على 10 أرقام على الأقل.");
        return;
    }

    const driverData = {
        name: formData.name.trim(),
        phoneNumber: cleanPhoneNumber, 
        balance: Math.round(initialBalance * 100) / 100,
        commissionType: formData.commissionType || 'value',
        commissionValue: formData.commissionValue !== undefined ? parseFloat(formData.commissionValue) || 0 : 0,
        passwordHash: null, // سيتعين لاحقاً بعد أول تسجيل OTP
        created_at: new Date().toISOString(),
        createdBy: userId
    };

    try {
        if (!window.appState.isAuthReady) {
            alertUser("نظام التوثيق غير جاهز بعد. يرجى المحاولة لاحقاً.");
            return;
        }
        
        // التحقق من عدم تكرار رقم الهاتف
        const q = query(collection(db, getCollectionPath('drivers')), where("phoneNumber", "==", cleanPhoneNumber));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            alertUser("هذا السائق موجود بالفعل. رقم الهاتف مستخدم.");
            return;
        }
    } catch (error) {
        console.error("خطأ في التحقق من وجود السائق:", error);
        if (error.code === 'permission-denied') {
            alertUser("خطأ في الصلاحيات: يرجى التأكد من تفعيل قواعد الأمان في Firebase Console.");
        } else {
            alertUser(`فشل التحقق من وجود السائق: ${error.message}`);
        }
        return;
    }

    try {
        // إضافة السائق أولاً
        const docRef = await addDoc(collection(db, getCollectionPath('drivers')), driverData);
        const driverId = docRef.id;

        // رفع الصورة إذا تم اختيارها
        const imageFile = formData.imageFile;
        if (imageFile && imageFile.size > 0) {
            try {
                if (storage) {
                    const imageURL = await uploadDriverImage(imageFile, driverId);
                    await updateDoc(docRef, { image: imageURL });
                    alertUser(`تم إضافة السائق: ${driverData.name} بنجاح مع الصورة! الرصيد المبدئي: ${driverData.balance.toFixed(2)} دينار. الرجاء استخدام OTP لأول تسجيل.`);
                } else {
                    const imageBase64 = await convertImageToBase64(imageFile);
                    await updateDoc(docRef, { image: imageBase64 });
                    alertUser(`تم إضافة السائق: ${driverData.name} بنجاح مع الصورة! الرصيد المبدئي: ${driverData.balance.toFixed(2)} دينار. الرجاء استخدام OTP لأول تسجيل.`);
                }
            } catch (imageError) {
                console.error("خطأ في معالجة الصورة:", imageError);
                alertUser(`تم إضافة السائق: ${driverData.name} بنجاح! لكن فشل معالجة الصورة. الرصيد المبدئي: ${driverData.balance.toFixed(2)} دينار. كلمة المرور: ${randomPassword}`);
            }
        } else {
            alertUser(`تم إضافة السائق: ${driverData.name} بنجاح! الرصيد المبدئي: ${driverData.balance.toFixed(2)} دينار. الرجاء استخدام OTP لأول تسجيل.`);
        }
        
        const addForm = document.getElementById('add-driver-form') || document.getElementById('driver-form');
        if (addForm) addForm.reset();
    } catch (e) {
        console.error("خطأ في إضافة السائق: ", e);
        if (e.code === 'permission-denied') {
            alertUser("خطأ في الصلاحيات: يرجى التأكد من تفعيل قواعد الأمان في Firebase Console.");
        } else {
            alertUser(`فشل إضافة السائق: ${e.message}`);
        }
    }
}

// 5. وظيفة تحديث السائق
async function updateDriver(driverId, formData) {
    if (!db) {
        alertUser("قاعدة البيانات غير متوفرة.");
        return;
    }

    const cleanPhoneNumber = formData.phoneNumber.replace(/\s+/g, '').replace(/[^\d]/g, '');
    
    if (!cleanPhoneNumber || cleanPhoneNumber.length < 10) {
        alertUser("رقم الهاتف غير صحيح. يجب أن يحتوي على 10 أرقام على الأقل.");
        return;
    }

    const updateData = {
        name: formData.name.trim(),
        phoneNumber: cleanPhoneNumber,
        balance: parseFloat(formData.balance) || 0,
        commissionType: formData.commissionType || 'value',
        commissionValue: formData.commissionValue !== undefined ? parseFloat(formData.commissionValue) || 0 : 0,
        updated_at: new Date().toISOString()
    };

    try {
        // التحقق من عدم تكرار رقم الهاتف
        const q = query(collection(db, getCollectionPath('drivers')), where("phoneNumber", "==", cleanPhoneNumber));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty && querySnapshot.docs[0].id !== driverId) {
            alertUser("رقم الهاتف مستخدم من قبل سائق آخر.");
            return;
        }

        const driverRef = doc(db, getCollectionPath('drivers'), driverId);
        
        // رفع الصورة إذا تم اختيارها
        const imageFile = formData.imageFile;
        if (imageFile && imageFile.size > 0) {
            try {
                if (storage) {
                    const imageURL = await uploadDriverImage(imageFile, driverId);
                    updateData.image = imageURL;
                } else {
                    const imageBase64 = await convertImageToBase64(imageFile);
                    updateData.image = imageBase64;
                }
            } catch (imageError) {
                console.error("خطأ في معالجة الصورة:", imageError);
                alertUser("تم حفظ البيانات لكن فشل تحديث الصورة.");
            }
        }

        await updateDoc(driverRef, updateData);
        alertUser(`تم تحديث بيانات السائق: ${updateData.name} بنجاح!`);
        
        // إعادة تعيين النموذج والحالة
        window.appState.editingDriver = null;
        window.setAppView('driver-management');
        
    } catch (error) {
        console.error("خطأ في تحديث السائق:", error);
        alertUser(`فشل تحديث السائق: ${error.message}`);
    }
}

// 6. وظيفة حذف السائق
async function deleteDriver(driverId, driverName) {
    if (!confirm(`هل أنت متأكد من حذف السائق: ${driverName}؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
        return;
    }

    try {
        await deleteDoc(doc(db, getCollectionPath('drivers'), driverId));
        alertUser(`تم حذف السائق: ${driverName} بنجاح!`);
    } catch (error) {
        console.error("خطأ في حذف السائق:", error);
        alertUser(`فشل حذف السائق: ${error.message}`);
    }
}

// وظائف مساعدة
function generateRandomPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

async function uploadDriverImage(file, driverId) {
    try {
        if (!file.type.startsWith('image/')) {
            throw new Error('الملف المحدد ليس صورة');
        }

        if (file.size > 5 * 1024 * 1024) {
            throw new Error('حجم الصورة كبير جداً. الحد الأقصى 5MB');
        }

        const fileName = `driver-${driverId}-${Date.now()}.${file.name.split('.').pop()}`;
        const imageRef = ref(storage, `driver-images/${driverId}/${fileName}`);

        const snapshot = await uploadBytes(imageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        return downloadURL;
    } catch (error) {
        console.error('خطأ في رفع الصورة:', error);
        throw error;
    }
}

function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            reject(new Error('الملف المحدد ليس صورة'));
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            reject(new Error('حجم الصورة كبير جداً. الحد الأقصى 5MB'));
            return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('خطأ في قراءة الصورة'));
        reader.readAsDataURL(file);
    });
}

function alertUser(message, type = 'info') {
    if (window.showToast) {
        window.showToast(type, message);
        return;
    }
    const messageBox = document.getElementById('status-message');
    if (!messageBox) return alert(message);
    messageBox.innerText = message;
    messageBox.classList.remove('hidden');
    messageBox.classList.add('show');
    messageBox.classList.remove('bg-yellow-100','border-yellow-400','text-yellow-700','bg-green-100','border-green-400','text-green-700','bg-red-100','border-red-400','text-red-700');
    if (type === 'success') messageBox.classList.add('bg-green-100','border-green-400','text-green-700');
    else if (type === 'error') messageBox.classList.add('bg-red-100','border-red-400','text-red-700');
    else messageBox.classList.add('bg-yellow-100','border-yellow-400','text-yellow-700');
    setTimeout(() => {
        messageBox.classList.remove('show');
        setTimeout(() => messageBox.classList.add('hidden'), 300);
    }, 3000);
}

// إضافة رصيد للسائق (معاملة آمنة)
async function creditDriverBalance(driverId, amountRaw) {
    if (!db) { alertUser('قاعدة البيانات غير متوفرة.'); return; }
    // حارس لمنع الطلبات المتتالية لنفس السائق
    window._creditBusy = window._creditBusy || new Set();
    if (window._creditBusy.has(driverId)) {
        return; // تجاهل إذا كانت هناك عملية جارية لنفس السائق
    }
    const amount = parseFloat(amountRaw);
    if (isNaN(amount) || amount === 0) { alertUser('أدخل مبلغاً صحيحاً أكبر من الصفر.'); return; }
    try {
        window._creditBusy.add(driverId);
        const driverRef = doc(db, getCollectionPath('drivers'), driverId);
        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(driverRef);
            if (!snap.exists()) throw new Error('السائق غير موجود');
            const d = snap.data();
            const newBalance = Math.round(((d.balance || 0) + amount) * 100) / 100;
            transaction.update(driverRef, { balance: newBalance, updated_at: new Date().toISOString() });
        });
        alertUser('تمت إضافة الرصيد بنجاح.');
    } catch (e) {
        console.error('credit balance error', e);
        alertUser(e.message || 'فشل إضافة الرصيد');
    } finally {
        window._creditBusy.delete(driverId);
    }
}

// تصدير الوظائف للاستخدام العالمي
window.addTripAndUpdateBalance = addTripAndUpdateBalance;
window.addDriver = addDriver;
window.updateDriver = updateDriver;
window.deleteDriver = deleteDriver;
window.alertUser = alertUser;
window.exportDriversCSV = exportDriversCSV;
window.exportTripsCSV = exportTripsCSV;
window.creditDriverBalance = creditDriverBalance;
window.editTrip = editTrip;
window.deleteTrip = deleteTrip;
window.applyEditTrip = applyEditTrip;
window.applyDeleteTrip = applyDeleteTrip;
