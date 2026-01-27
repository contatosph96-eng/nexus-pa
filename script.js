const MASTER_USER = "neguedri";
const MASTER_PASS = "@Vinte812";

// Bancos de Dados Locais
let atendimentos = JSON.parse(localStorage.getItem('nexus_atendimentos')) || [];
let usuarios = JSON.parse(localStorage.getItem('nexus_usuarios')) || [];
let lixeira = JSON.parse(localStorage.getItem('nexus_lixeira')) || [];

// 1. SISTEMA DE LOGIN
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('login-user').value;
    const p = document.getElementById('login-pass').value;
    const userDB = usuarios.find(user => user.email === u && user.pass === p);

    if ((u === MASTER_USER && p === MASTER_PASS) || userDB) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'grid';
        if (u !== MASTER_USER) {
            const btnEq = document.getElementById('btn-admin-usuarios');
            if(btnEq) btnEq.style.display = 'none';
        }
        renderizarAtendimentos();
        renderizarUsuarios();
        renderizarLixeira();
        iniciarRelogio();
    } else { alert("Acesso Negado."); }
});

// 2. SALVAR/EDITAR PROCESSO (CORRIGIDO)
document.getElementById('relatorio-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    
    const dados = {
        id: id ? parseInt(id) : Date.now(),
        cliente: document.getElementById('cliente').value,
        servico: document.getElementById('servico').value,
        status: document.getElementById('status').value,
        categoria: document.getElementById('categoria').value,
        pendencia: document.getElementById('detalhespendencia').value,
        detalhes: document.getElementById('detalhes').value,
        timestamp: id ? document.getElementById('edit-timestamp').innerText : `Protocolo: ${new Date().toLocaleString('pt-BR')}`
    };

    if (id) {
        // MODO EDIÇÃO: Substitui o item correto no array
        const index = atendimentos.findIndex(a => a.id === parseInt(id));
        if (index !== -1) atendimentos[index] = dados;
    } else {
        // MODO NOVO: Adiciona um novo item
        atendimentos.push(dados);
    }

    localStorage.setItem('nexus_atendimentos', JSON.stringify(atendimentos));
    toggleForm();
    renderizarAtendimentos();
});

// 3. SISTEMA DE RECICLAGEM
function moverParaLixeira() {
    const id = document.getElementById('edit-id').value;
    if (!id) return;

    if (confirm("Mover este processo para a Reciclagem?")) {
        const index = atendimentos.findIndex(a => a.id === parseInt(id));
        if (index !== -1) {
            const removido = atendimentos.splice(index, 1)[0];
            lixeira.push(removido);
            localStorage.setItem('nexus_atendimentos', JSON.stringify(atendimentos));
            localStorage.setItem('nexus_lixeira', JSON.stringify(lixeira));
            toggleForm();
            renderizarAtendimentos();
            renderizarLixeira();
        }
    }
}

function renderizarLixeira() {
    const grid = document.getElementById('grid-lixeira');
    if (!grid) return;
    grid.innerHTML = lixeira.map(a => `
        <div class="pastilha" style="border-left-color: #ff4d4d;">
            <h4>${a.cliente}</h4>
            <p>Nº: ${a.servico}</p>
            <div style="margin-top:15px; display:flex; gap:10px;">
                <button onclick="restaurar(${a.id})" class="edit-user-btn" style="flex:1"><i class="fas fa-undo"></i> Restaurar</button>
                <button onclick="apagarDefinitivo(${a.id})" class="delete-btn" style="flex:1"><i class="fas fa-trash-can"></i> Apagar</button>
            </div>
        </div>
    `).join('') || '<p style="padding:20px; color:#a0aec0;">Nenhum item na lixeira.</p>';
}

function restaurar(id) {
    const idx = lixeira.findIndex(a => a.id === id);
    if (idx !== -1) {
        atendimentos.push(lixeira.splice(idx, 1)[0]);
        localStorage.setItem('nexus_atendimentos', JSON.stringify(atendimentos));
        localStorage.setItem('nexus_lixeira', JSON.stringify(lixeira));
        renderizarAtendimentos();
        renderizarLixeira();
    }
}

function apagarDefinitivo(id) {
    if (confirm("ATENÇÃO: Deseja excluir permanentemente da base Nexus?")) {
        lixeira = lixeira.filter(a => a.id !== id);
        localStorage.setItem('nexus_lixeira', JSON.stringify(lixeira));
        renderizarLixeira();
    }
}

// 4. GESTÃO DE EQUIPE
document.getElementById('user-form').addEventListener('submit', (e) => {
    e.preventDefault();
    usuarios.push({ id: Date.now(), email: document.getElementById('user-email').value, pass: document.getElementById('user-pass').value });
    localStorage.setItem('nexus_usuarios', JSON.stringify(usuarios));
    e.target.reset();
    renderizarUsuarios();
});

function renderizarUsuarios() {
    const lista = document.getElementById('lista-usuarios');
    if (!lista) return;
    lista.innerHTML = usuarios.map(u => `
        <li class="user-item">
            <span><strong>${u.email}</strong></span>
            <div style="display:flex; gap:5px;">
                <button class="edit-user-btn" onclick="edtSenha(${u.id})"><i class="fas fa-key"></i></button>
                <button class="delete-btn" onclick="remUser(${u.id})"><i class="fas fa-trash"></i></button>
            </div>
        </li>
    `).join('');
}

function edtSenha(id) {
    const u = usuarios.find(x => x.id === id);
    const n = prompt("Nova senha para " + u.email + ":");
    if (n) { u.pass = n; localStorage.setItem('nexus_usuarios', JSON.stringify(usuarios)); renderizarUsuarios(); }
}

function remUser(id) {
    if (confirm("Remover acesso deste colaborador?")) { 
        usuarios = usuarios.filter(x => x.id !== id); 
        localStorage.setItem('nexus_usuarios', JSON.stringify(usuarios)); 
        renderizarUsuarios(); 
    }
}

// 5. INTERFACE E DINÂMICA
function toggleCamposStatus() {
    const s = document.getElementById('status').value;
    const campoP = document.getElementById('detalhespendencia');
    if (campoP) campoP.style.display = (s === 'Pendente' ? 'block' : 'none');
}

function renderizarAtendimentos() {
    const busca = document.getElementById('busca').value.toLowerCase();
    const filt = atendimentos.filter(a => a.cliente.toLowerCase().includes(busca) || a.servico.toLowerCase().includes(busca));
    const criar = (l) => l.map(a => `
        <div class="pastilha status-${a.status}" onclick="editarProcesso(${a.id})">
            <h4>${a.cliente}</h4>
            <p>Nº: ${a.servico}</p>
            <p><small>${a.categoria}</small></p>
        </div>
    `).join('');
    document.getElementById('grid-pendentes').innerHTML = criar(filt.filter(a => a.status === 'Pendente'));
    document.getElementById('grid-concluidos').innerHTML = criar(filt.filter(a => a.status === 'Concluído'));
}

function editarProcesso(id) {
    const a = atendimentos.find(p => p.id === id);
    if(!a) return;
    toggleForm();
    document.getElementById('edit-id').value = a.id;
    document.getElementById('cliente').value = a.cliente;
    document.getElementById('servico').value = a.servico;
    document.getElementById('status').value = a.status;
    document.getElementById('categoria').value = a.categoria;
    document.getElementById('detalhespendencia').value = a.pendencia || "";
    document.getElementById('detalhes').value = a.detalhes;
    document.getElementById('edit-timestamp').innerText = a.timestamp;
    
    const btnEx = document.getElementById('btn-excluir-processo');
    btnEx.style.display = 'flex';
    btnEx.onclick = moverParaLixeira;
    
    toggleCamposStatus();
}

function toggleForm() {
    const f = document.getElementById('relatorio-form');
    f.style.display = (f.style.display === 'none' ? 'block' : 'none');
    if (f.style.display === 'none') { 
        f.reset(); 
        document.getElementById('btn-excluir-processo').style.display = 'none'; 
        document.getElementById('edit-id').value = ''; 
    }
    toggleCamposStatus();
}

function showTab(t) {
    document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${t}`).classList.add('active');
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
}

function iniciarRelogio() { setInterval(() => { const r = document.getElementById('relogio'); if(r) r.innerText = new Date().toLocaleString('pt-BR'); }, 1000); }
function logout() { location.reload(); }