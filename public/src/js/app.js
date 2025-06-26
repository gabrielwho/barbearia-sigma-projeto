const { createApp } = Vue;

createApp({
  data() {
    return {
      telaAtiva: 'login',
      carregando: false,
      loginForm: {
        email: '',
        senha: ''
      },
      cadastroForm: {
        nome: '',
        email: '',
        senha: '',
        confirmaSenha: ''
      },
      mensagem: null
    };
  },
  methods: {
    // --- Login de Usuário ---
    async fazerLogin() {
      this.carregando = true;
      this.mensagem = null; // Limpa mensagens anteriores

      try {
        // 1. Autentica o usuário com e-mail e senha no Firebase Auth
        const userCredential = await firebase.auth().signInWithEmailAndPassword(
          this.loginForm.email,
          this.loginForm.senha
        );

        // Verifica se userCredential.user existe para evitar erros
        if (!userCredential.user) {
            throw new Error('Usuário não encontrado após autenticação.');
        }

        const uid = userCredential.user.uid;

        // 2. Busca os dados adicionais do usuário (incluindo o tipo) no Firestore
        const userDoc = await firebase.firestore()
          .collection('usuarios')
          .doc(uid)
          .get();

        // Console log para debug: Ajuda a verificar o que está vindo do Firestore
        console.log('Dados do usuário no Firestore:', {
          exists: userDoc.exists,
          data: userDoc.data(),
          uid: uid
        });

        // 3. Verifica se o documento do usuário existe no Firestore
        if (!userDoc.exists) {
          // Se o usuário autenticou mas não tem documento no Firestore, algo está errado
          throw new Error('Dados do perfil não encontrados. Por favor, entre em contato com o suporte.');
        }

        // 4. Obtém o tipo de usuário e redireciona
        const userData = userDoc.data();

        // **NOVOS CONSOLE.LOGS PARA DEBUGAR O VALOR EXATO E AS COMPARAÇÕES**
        console.log('--- Debug de Tipo de Usuário ---');
        console.log('Valor de userData.tipo lido do Firestore:', userData.tipo);
        console.log('Tipo de dado de userData.tipo:', typeof userData.tipo); // Verifica se é string
        console.log('Comparando com "admin" (original):', userData.tipo === 'admin');
        console.log('Comparando com "cliente" (original):', userData.tipo === 'cliente');
        console.log('Comparando com "admin" após .trim():', (userData.tipo || '').trim() === 'admin');
        console.log('Comparando com "cliente" após .trim():', (userData.tipo || '').trim() === 'cliente');
        console.log('---------------------------------');


        // USA O .trim() NA COMPARAÇÃO PARA REMOVER ESPAÇOS EM BRANCO
        // Adicionei (userData.tipo || '') para garantir que não tente trim em undefined/null
        if ((userData.tipo || '').trim() === 'admin') {
          window.location.href = 'admin.html';
        } else if ((userData.tipo || '').trim() === 'cliente') { // Adicionado verificação explícita para cliente
          window.location.href = 'cliente.html';
        } else {
          // Se o tipo não for 'admin' nem 'cliente', redireciona para uma página padrão ou exibe erro
          console.error('Tipo de usuário inválido encontrado no Firestore:', userData.tipo); // Log mais específico
          throw new Error('Tipo de usuário desconhecido. Entre em contato com o suporte.');
        }

      } catch (error) {
        console.error('Erro no login:', error);
        // Exibe uma mensagem de erro mais amigável
        this.mensagem = {
          tipo: 'erro',
          texto: this.tratarErrosFirebaseLogin(error.code) // Usa função específica para login
        };
      } finally {
        this.carregando = false;
      }
    },

    // Tratamento de Erros de Login (ajustado para ser mais específico)
    tratarErrosFirebaseLogin(code) {
      const erros = {
        'auth/invalid-email': 'E-mail inválido. Verifique o formato.',
        'auth/user-not-found': 'Usuário não cadastrado. Verifique o e-mail ou crie uma conta.',
        'auth/wrong-password': 'Senha incorreta. Tente novamente.',
        'auth/too-many-requests': 'Muitas tentativas de login. Sua conta foi temporariamente bloqueada. Tente novamente mais tarde.',
        'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
        // Erro genérico para outros casos não mapeados
        'default': 'Erro ao fazer login. Tente novamente.'
      };
      return erros[code] || erros['default'];
    },

    // --- Cadastro de Usuário ---
    async cadastrarUsuario() {
      // 1. Validações iniciais
      if (this.cadastroForm.senha.length < 6) {
        this.mensagem = { tipo: 'erro', texto: 'A senha deve ter no mínimo 6 caracteres.' };
        return;
      }
      if (this.cadastroForm.senha !== this.cadastroForm.confirmaSenha) {
        this.mensagem = { tipo: 'erro', texto: 'As senhas não coincidem!' };
        return;
      }

      this.carregando = true;
      this.mensagem = null; // Limpa mensagens anteriores

      try {
        // 1. Cria o usuário no Firebase Authentication
        const userCredential = await auth.createUserWithEmailAndPassword( // 'auth' vem de firebase-config.js
          this.cadastroForm.email,
          this.cadastroForm.senha
        );

        // 2. Salva dados adicionais do usuário no Firestore
        await db.collection('usuarios').doc(userCredential.user.uid).set({ // 'db' vem de firebase-config.js
          nome: this.cadastroForm.nome,
          email: this.cadastroForm.email,
          tipo: 'cliente', // Define 'cliente' como padrão para novos cadastros
          criadoEm: firebase.firestore.FieldValue.serverTimestamp() // Adiciona timestamp
        });

        // Sucesso no cadastro
        this.mensagem = {
          tipo: 'sucesso',
          texto: 'Cadastro realizado com sucesso! Agora você pode fazer login.'
        };
        // Redireciona para a tela de login
        this.telaAtiva = 'login';
        // Limpa os campos do formulário após o sucesso
        this.cadastroForm = { nome: '', email: '', senha: '', confirmaSenha: '' };

      } catch (error) {
        console.error('Erro no cadastro:', error);
        // Exibe uma mensagem de erro mais amigável
        this.mensagem = {
          tipo: 'erro',
          texto: this.tratarErrosFirebaseCadastro(error.code) // Usa função específica para cadastro
        };
      } finally {
        this.carregando = false;
      }
    },

    // Tratamento de Erros de Cadastro (ajustado para ser mais específico)
    tratarErrosFirebaseCadastro(code) {
      const erros = {
        'auth/invalid-email': 'E-mail inválido. Por favor, verifique o formato.',
        'auth/email-already-in-use': 'Este e-mail já está em uso. Tente outro ou faça login.',
        'auth/weak-password': 'A senha é muito fraca. Escolha uma senha com pelo menos 6 caracteres.',
        'auth/operation-not-allowed': 'Criação de conta desabilitada. Entre em contato com o suporte.',
        'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
        // Erro genérico para outros casos não mapeados
        'default': 'Erro ao criar conta. Tente novamente.'
      };
      return erros[code] || erros['default'];
    }
  }
}).mount('#app');