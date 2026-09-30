import { useState, useEffect, useCallback } from 'react';
import { useDocStore } from '@/store/useDocStore';
import { toast } from "sonner";
import { formatNumberInput, formatIntInput, parseCurrency, formatCurrency } from '../lib/format';

interface Payment {
    paymentMethod: string;
    description: string;
    amount: string;
}

interface EditFormData {
    docType: number;
    customerNo: string;
    customerName: string;
    rtn: string;
    payments: Payment[];
    placa: string;
    chofer: string;
    km: string;
    orden: string;
    blocked?: number | boolean;
    usualBillingType?: number;
}

function buildFormData(doc: any): EditFormData {
    return {
        docType: doc.docType,
        customerNo: doc.customerNo || '',
        customerName: doc.customerName || '',
        rtn: doc.rtn || '',
        payments: doc.payments
            ? doc.payments.map((p: any) => ({
                  ...p,
                  amount: formatNumberInput(String(Number(p.amount || 0).toFixed(2))),
              }))
            : [],
        placa: (doc.placa || '').toUpperCase(),
        chofer: (doc.chofer || '').toUpperCase(),
        km: doc.km ? formatIntInput(String(Math.floor(Number(doc.km || 0)))) : '',
        orden: (doc.orden || '').toUpperCase(),
    };
}

export function useDocumentEdit(doc: any, onSuccess: () => void, onClose: () => void) {
    const { updateDocument, searchCustomers, getChargeMethods } = useDocStore();
    const [loading, setLoading] = useState(false);
    const [fetchingMethods, setFetchingMethods] = useState(false);
    const [chargeMethods, setChargeMethods] = useState<any[]>([]);

    const [customerSearch, setCustomerSearch] = useState('');
    const [customers, setCustomers] = useState<any[]>([]);
    const [searchingCustomers, setSearchingCustomers] = useState(false);
    const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);

    const [formData, setFormData] = useState<EditFormData>(buildFormData(doc));

    useEffect(() => {
        const fetchMethods = async () => {
            setFetchingMethods(true);
            try {
                const methods = await getChargeMethods();
                setChargeMethods(methods);
            } catch (error) {
            } finally {
                setFetchingMethods(false);
            }
        };
        fetchMethods();
    }, [getChargeMethods]);

    useEffect(() => {
        if (doc) {
            setFormData(buildFormData(doc));
        }
    }, [doc]);

    useEffect(() => {
        if (doc?.customerNo) {
            (async () => {
                try {
                    const results = await searchCustomers(doc.customerNo);
                    const customer = results.find((c: any) => c.customerNo === doc.customerNo);
                    if (customer) {
                        setFormData(prev => ({
                            ...prev,
                            usualBillingType: customer.usualBillingType,
                            blocked: customer.blocked,
                        }));
                    }
                } catch {}
            })();
        }
    }, [doc?.customerNo, searchCustomers]);

    const handleDocTypeChange = useCallback((value: string) => {
        const newType = parseInt(value);
        if (newType === 2) {
            if (formData.usualBillingType !== 0) {
                toast.error('Para cambiar a Factura Crédito, el cliente seleccionado debe ser de tipo crédito.');
                return;
            }
            if (doc.leal?.type === 1) {
                toast.error('No se puede cambiar a crédito: el documento tiene pago con Leal (redención).');
                return;
            }
        }
        let newPayments = [...formData.payments];
        if (newType === 2) {
            newPayments = [
                {
                    paymentMethod: 'CREDITO',
                    description: 'CREDITO',
                    amount: formatNumberInput(String(Number(doc.totalAmount || 0).toFixed(2))),
                },
            ];
        }
        setFormData((prev) => ({
            ...prev,
            docType: newType,
            payments: newPayments,
            ...(newType === 2 ? {
                placa: prev.placa || '0',
                chofer: prev.chofer || '0',
                km: prev.km || '0',
                orden: prev.orden || '0',
            } : {}),
        }));
    }, [formData.payments, formData.usualBillingType, doc.totalAmount, doc.leal]);

    const handleSearchCustomers = useCallback(async () => {
        if (!customerSearch.trim()) return;
        setSearchingCustomers(true);
        try {
            const results = await searchCustomers(customerSearch);
            setCustomers(results);
        } catch (error) {
            toast.error("Error al buscar clientes");
        } finally {
            setSearchingCustomers(false);
        }
    }, [customerSearch, searchCustomers]);

    const selectCustomer = useCallback((customer: any) => {
        setFormData((prev) => ({
            ...prev,
            customerNo: customer.customerNo,
            customerName: customer.customerName,
            rtn: customer.rtn,
            usualBillingType: customer.usualBillingType,
            blocked: customer.blocked,
        }));
        setIsCustomerPopoverOpen(false);
        const typeMsg = customer.usualBillingType === 0 ? ' (Crédito)' : ' (Contado)';
        const blockMsg = customer.blocked === 1 ? ' - BLOQUEADO' : '';
        toast.info(`Cliente seleccionado: ${customer.customerName}${typeMsg}${blockMsg}`);
        if (customer.blocked === 1) toast.warning("Este cliente está marcado como bloqueado en TPV.");
    }, []);

    const handleAddPayment = useCallback(() => {
        if (formData.docType === 2) {
            toast.error("Las facturas a crédito solo permiten el método de pago CREDITO");
            return;
        }
        const currentSum = formData.payments.reduce((sum: number, p: Payment) => sum + parseCurrency(p.amount), 0);
        const remaining = Math.max(0, Number(doc.totalAmount) - currentSum);
        const firstMethod = chargeMethods.length > 0 ? chargeMethods[0].code : 'EFECTIVO';
        const firstDesc = chargeMethods.length > 0 ? chargeMethods[0].description : 'EFECTIVO';
        setFormData((prev) => ({
            ...prev,
            payments: [
                ...prev.payments,
                {
                    paymentMethod: firstMethod,
                    description: firstDesc,
                    amount: formatNumberInput(String(remaining.toFixed(2))),
                },
            ],
        }));
    }, [formData.docType, formData.payments, doc.totalAmount, chargeMethods]);

    const handleRemovePayment = useCallback((index: number) => {
        if (formData.docType === 2) return;
        const remainingPayments = formData.payments.filter((_: any, i: number) => i !== index);
        const remainingSum = remainingPayments.reduce((sum: number, p: any) => sum + parseCurrency(p.amount), 0);
        if (Math.abs(remainingSum - doc.totalAmount) > 0.01) {
            toast.error('No se puede eliminar el pago: la factura quedaría descuadrada.');
            return;
        }
        setFormData((prev) => ({
            ...prev,
            payments: remainingPayments,
        }));
    }, [formData.docType, formData.payments, doc.totalAmount]);

    const handlePaymentChange = useCallback((index: number, field: string, value: any) => {
        setFormData((prev) => {
            const newPayments = [...prev.payments];
            const finalValue = field === 'amount' ? formatNumberInput(String(value)) : value;
            newPayments[index] = { ...newPayments[index], [field]: finalValue };
            if (field === 'paymentMethod') {
                const methodObj = chargeMethods.find((m: any) => m.code === value);
                if (methodObj) {
                    newPayments[index].description = methodObj.description;
                }
            }
            return { ...prev, payments: newPayments };
        });
    }, [chargeMethods]);

    const setField = useCallback((field: keyof EditFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleSave = useCallback(async () => {
        const currentSum = Number(
            formData.payments
                .reduce((sum: number, p: Payment) => sum + parseCurrency(p.amount), 0)
                .toFixed(2)
        );
        const docTotal = Number(Number(doc.totalAmount).toFixed(2));

        if (currentSum > docTotal + 0.01) {
            toast.error(
                `El total de las formas de pago (${formatCurrency(currentSum)}) sobrepasa el valor total del documento (${formatCurrency(docTotal)})`
            );
            return;
        }

        if (Math.abs(currentSum - docTotal) > 0.01) {
            toast.error(
                `El total de los pagos (${formatCurrency(currentSum)}) debe coincidir exactamente con el total del documento (${formatCurrency(docTotal)})`
            );
            return;
        }

        if (formData.docType === 1 && formData.payments.some((p: Payment) => p.paymentMethod === 'CREDITO')) {
            toast.error("Las facturas al contado no pueden tener 'CREDITO' como forma de pago.");
            return;
        }

        if (doc.status !== 0) {
            toast.error("Solo se pueden editar documentos que no han sido enviados (Estatus: No enviado).");
            return;
        }

        if (formData.docType === 2) {
            if (!formData.customerNo || formData.customerNo === 'CONTADO') {
                toast.error("Para facturas al crédito se debe seleccionar un cliente con cuenta válida.");
                return;
            }
            if (formData.blocked === 1) {
                toast.error(`El cliente ${formData.customerName} está BLOQUEADO y no puede recibir crédito.`);
                return;
            }
            if (formData.usualBillingType !== 0 && formData.usualBillingType !== undefined) {
                toast.error(`El cliente ${formData.customerName} es de tipo CONTADO y no permite crédito.`);
                return;
            }
        }

        if (!formData.customerName) {
            toast.error("El nombre del cliente es obligatorio");
            return;
        }

        setLoading(true);
        try {
            const apiData = {
                ...formData,
                payments: formData.payments.map((p: Payment) => ({
                    ...p,
                    amount: parseCurrency(p.amount),
                })),
            };
            const res = await updateDocument(doc.transactionId, apiData);
            if (res.success) {
                toast.success("Documento actualizado correctamente");
                onSuccess();
                onClose();
            } else {
                toast.error(res.error || "Error al actualizar documento");
            }
        } catch (error) {
            toast.error("Error inesperado al guardar");
        } finally {
            setLoading(false);
        }
    }, [formData, doc, updateDocument, onSuccess, onClose]);

    return {
        formData,
        setField,
        setFormData,
        loading,
        chargeMethods,
        fetchingMethods,
        customerSearch,
        setCustomerSearch,
        customers,
        searchingCustomers,
        isCustomerPopoverOpen,
        setIsCustomerPopoverOpen,
        handleDocTypeChange,
        handleSearchCustomers,
        selectCustomer,
        handleAddPayment,
        handleRemovePayment,
        handlePaymentChange,
        handleSave,
    };
}
