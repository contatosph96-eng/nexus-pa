/* ==========================================================================
   CONFIGURAÇÃO E VARIÁVEIS GLOBAIS
   ========================================================================== */
const firebaseConfig = {
    apiKey: "AIzaSyC-EARkRRo1YIBMCdF0rr55qaPJKJLci7A",
    authDomain: "nexus-pa-oficial.firebaseapp.com",
    databaseURL: "https://nexus-pa-oficial-default-rtdb.firebaseio.com/",
    projectId: "nexus-pa-oficial",
    storageBucket: "nexus-pa-oficial.firebasestorage.app",
    messagingSenderId: "271862687743",
    appId: "1:271862687743:web:322598b6985d58f1a6a9ca"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const MASTER_USER = "neguedri";
const MASTER_PASS = "@Vinte812";

let atendimentos = [];
let usuarios = [];
let lixeira = [];
let loggedUserId = null; // Armazena quem está logado

/* ==========================================================================
   1. SINCRONIZAÇÃO (USUÁRIOS E DADOS PRIVADOS)
   ========================================================================== */

// Sincroniza a lista de usuários (Apenas para validação de login e gestão de equipe)
db.ref('nexus/usuarios').on('value', (snapshot) => {
    usuarios = snapshot.val() || [{ id: 'master', email: MASTER_USER, pass: MASTER_PASS }];
    renderizarUsuarios();
});

// Função para ativar o sincronismo dos dados do usuário logado
function ativarSincronizacaoPrivada(userId) {
    loggedUserId = userId;
    
    // O caminho agora é único por usuário
    db.ref(`nexus/data/${userId}`).on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            atendimentos = data.atendimentos || [];
            lixeira = data.lixeira || [];
        } else {
            atendimentos = [];
            lixeira = [];
        }
        renderizarAtendimentos();
        renderizarLixeira();
    });
}

function salvarDadosNexus() {
    if (!loggedUserId) return;
    
    // Salva apenas na pasta do usuário logado
    db.ref(`nexus/data/${loggedUserId}`).set({
        atendimentos: atendimentos,
        lixeira: lixeira
    });
}

/* ==========================================================================
   2. SISTEMA DE LOGIN PRIVADO
   ========================================================================== */
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('login-user').value;
    const p = document.getElementById('login-pass').value;
    
    // Busca usuário no banco
    const userDB = usuarios.find(user => user.email === u && user.pass === p);

    if (u === MASTER_USER && p === MASTER_PASS) {
        ativarSincronizacaoPrivada('master');
        entrarNoPainel(true);
    } else if (userDB) {
        ativarSincronizacaoPrivada(userDB.id);
        entrarNoPainel(false);
    } else {
        alert("Acesso Negado.");
    }
});

function entrarNoPainel(isMaster) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'grid';
    
    // Se não for master, esconde a gestão de usuários
    const btnEq = document.getElementById('btn-admin-usuarios');
    if (btnEq) btnEq.style.display = isMaster ? 'block' : 'none';
    
    iniciarRelogio();
}

/* ==========================================================================
   3. GESTÃO DE EQUIPE (SALVA NA LISTA GLOBAL DE LOGINS)
   ========================================================================== */
document.getElementById('user-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const novoUsuario = { 
        id: Date.now(), 
        email: document.getElementById('user-email').value, 
        pass: document.getElementById('user-pass').value 
    };
    
    usuarios.push(novoUsuario);
    db.ref('nexus/usuarios').set(usuarios); // Salva na lista global de acessos
    e.target.reset();
});

function remUser(id) {
    if (id === 'master') return alert("O mestre não pode ser removido.");
    if (confirm("Remover acesso deste colaborador?")) {
        usuarios = usuarios.filter(x => x.id !== id);
        db.ref('nexus/usuarios').set(usuarios);
    }
}

/* As outras funções (renderizarAtendimentos, editarProcesso, moverParaLixeira, etc) 
   permanecem as mesmas do seu código original, pois elas já manipulam os 
   arrays locais que agora são alimentados apenas pelos dados do usuário logado. */

function logout() { location.reload(); }
