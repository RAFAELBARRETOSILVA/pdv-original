import { useState } from 'react';
import { fetchCep, formatCep } from '@/lib/utils';
import { toast } from 'sonner';
import { usePosStore } from '@/store/pos-store';
import { Customer } from '@/types/pos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, User, Trash2, Edit2, Plus, Mail, Phone, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function Customers() {
  const { customers, addCustomer, updateCustomer, removeCustomer } = usePosStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cep: '',
    address: '',
    city: '',
    state: '',
    neighborhood: '',
    complement: '',
  });

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        cep: customer.cep || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        neighborhood: customer.neighborhood || '',
        complement: customer.complement || '',
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        cep: '',
        address: '',
        city: '',
        state: '',
        neighborhood: '',
        complement: '',
      });
    }
    setOpenDialog(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Preencha todos os campos obrigatórios (Nome, Email, Telefone)');
      return;
    }

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, formData);
    } else {
      addCustomer(formData);
    }

    setOpenDialog(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      cep: '',
      address: '',
      city: '',
      state: '',
      neighborhood: '',
      complement: '',
    });
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto pos-scrollbar animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground text-sm">
            {customers.length} cliente{customers.length !== 1 ? 's' : ''} cadastrado{customers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label>Telefone *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label>CEP</Label>
                <Input
                  value={formData.cep}
                  onChange={async (e) => {
                    const formatted = formatCep(e.target.value);
                    setFormData((prev) => ({ ...prev, cep: formatted }));
                    if (formatted.replace(/\D/g, '').length === 8) {
                      const data = await fetchCep(formatted);
                      if (data) {
                        setFormData((prev) => ({
                          ...prev,
                          address: data.logradouro || prev.address,
                          neighborhood: data.bairro || prev.neighborhood,
                          city: data.localidade || prev.city,
                          state: data.uf || prev.state,
                          complement: data.complemento || prev.complement,
                        }));
                        toast.success('Endereço encontrado!');
                      } else {
                        toast.error('CEP não encontrado.');
                      }
                    }
                  }}
                  placeholder="12345-678"
                />
              </div>
              <div>
                <Label>Endereço</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, avenida, número"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Bairro</Label>
                  <Input
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    placeholder="Bairro"
                  />
                </div>
                <div>
                  <Label>Complemento</Label>
                  <Input
                    value={formData.complement}
                    onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                    placeholder="Apto, sala..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="SP, RJ..."
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setOpenDialog(false)} className="border border-input hover:bg-accent">
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                  {editingCustomer ? 'Atualizar' : 'Criar'} Cliente
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Buscar por nome, email ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Users className="h-16 w-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">
            {customers.length === 0 ? 'Nenhum cliente cadastrado' : 'Nenhum cliente encontrado'}
          </p>
          <p className="text-sm">
            {customers.length === 0 ? 'Comece adicionando seu primeiro cliente' : 'Tente uma busca diferente'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{customer.name}</h3>
                    <p className="text-xs text-muted-foreground">ID: {customer.id.substring(0, 8)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="h-9 px-3"
                    onClick={() => handleOpenDialog(customer)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    className="h-9 px-3 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm('Deseja remover este cliente?')) {
                        removeCustomer(customer.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{customer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{customer.phone}</span>
                </div>
                {customer.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{customer.address}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold">{customer.totalOrders}</p>
                  <p className="text-xs text-muted-foreground">Pedido{customer.totalOrders !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{fmt(customer.totalSpent)}</p>
                  <p className="text-xs text-muted-foreground">Total gasto</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
