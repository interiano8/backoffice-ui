import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Save } from 'lucide-react';
import { EditDocumentForm } from './EditDocumentForm';
import { useDocumentEdit } from '@/hooks/useDocumentEdit';

interface EditDocumentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    doc: any;
    onSuccess: () => void;
}

export const EditDocumentModal: React.FC<EditDocumentModalProps> = ({ open, onOpenChange, doc, onSuccess }) => {
    const {
        formData,
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
    } = useDocumentEdit(doc, onSuccess, () => onOpenChange(false));

    const isRestrictedType = [3, 7].includes(doc.docType);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <FileText className="h-5 w-5 text-primary" />
                        Editar Documento: {doc.docNo}
                    </DialogTitle>
                    <DialogDescription>
                        {isRestrictedType
                            ? "Para este tipo de documento solo se permite cambiar la información del cliente."
                            : "Realice los cambios necesarios. Solo se pueden editar documentos que aún no han sido enviados."
                        }
                    </DialogDescription>
                </DialogHeader>

                <EditDocumentForm
                    doc={doc}
                    formData={formData}
                    setFormData={setFormData}
                    chargeMethods={chargeMethods}
                    fetchingMethods={fetchingMethods}
                    customerSearch={customerSearch}
                    setCustomerSearch={setCustomerSearch}
                    customers={customers}
                    searchingCustomers={searchingCustomers}
                    isCustomerPopoverOpen={isCustomerPopoverOpen}
                    setIsCustomerPopoverOpen={setIsCustomerPopoverOpen}
                    handleDocTypeChange={handleDocTypeChange}
                    handleSearchCustomers={handleSearchCustomers}
                    selectCustomer={selectCustomer}
                    handleAddPayment={handleAddPayment}
                    handleRemovePayment={handleRemovePayment}
                    handlePaymentChange={handlePaymentChange}
                />

                <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="gap-2 min-w-[120px]">
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Guardar Cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
