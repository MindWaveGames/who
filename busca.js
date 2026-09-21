const API_BASE = 'https://editoramindwave.com.br/api';

// --- Modo dia/noite (mesmo comportamento do site principal) ---
const ICONE_SOL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`;
const ICONE_LUA = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>`;
const ICONE_HOME = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>`;

const btnTema = document.getElementById('btnTema');
function aplicarPreferenciaTema() {
  const claro = localStorage.getItem('who_tema') === 'claro';
  document.body.classList.toggle('tema-claro', claro);
  btnTema.innerHTML = claro ? ICONE_SOL : ICONE_LUA;
}
btnTema.addEventListener('click', () => {
  const claroAtual = document.body.classList.contains('tema-claro');
  localStorage.setItem('who_tema', claroAtual ? 'escuro' : 'claro');
  aplicarPreferenciaTema();
});
aplicarPreferenciaTema();

document.getElementById('btnHome').innerHTML = ICONE_HOME;
document.getElementById('btnHome').addEventListener('click', () => {
  window.location.href = window.location.origin;
});

function iniciaisNome(nome) {
  return (nome || '?').trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

const SELO_VERIFICADO_PESSOAL = `<svg viewBox="0 0 24 24" fill="currentColor" style="width:13px;height:13px;color:var(--accent);vertical-align:-2px;display:inline-block;"><path d="M12 2l2.4 1.7 2.9-.4 1 2.8 2.6 1.4-.6 2.9 1.6 2.6-1.6 2.6.6 2.9-2.6 1.4-1 2.8-2.9-.4L12 22l-2.4-1.7-2.9.4-1-2.8-2.6-1.4.6-2.9L2.1 12l1.6-2.6-.6-2.9 2.6-1.4 1-2.8 2.9.4L12 2z"/><path d="M9.5 12.5l1.8 1.8 3.5-3.8" stroke="var(--paper)" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const SELO_VERIFICADO_INSTITUCIONAL = `<svg viewBox="0 0 24 24" style="width:13px;height:13px;vertical-align:-2px;display:inline-block;"><defs><linearGradient id="gd" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFF3C4"/><stop offset="35%" stop-color="#E5B84B"/><stop offset="65%" stop-color="#C99A2E"/><stop offset="100%" stop-color="#FFE9A8"/></linearGradient></defs><path fill="url(#gd)" d="M12 2l2.4 1.7 2.9-.4 1 2.8 2.6 1.4-.6 2.9 1.6 2.6-1.6 2.6.6 2.9-2.6 1.4-1 2.8-2.9-.4L12 22l-2.4-1.7-2.9.4-1-2.8-2.6-1.4.6-2.9L2.1 12l1.6-2.6-.6-2.9 2.6-1.4 1-2.8 2.9.4L12 2z"/><path d="M9.5 12.5l1.8 1.8 3.5-3.8" stroke="#4A3600" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function seloVerificado(pagina) {
  if (!pagina.verificado) return '';
  return pagina.verificado_tipo === 'institucional' ? SELO_VERIFICADO_INSTITUCIONAL : SELO_VERIFICADO_PESSOAL;
}

// --- Segmentos (categorias) ---
let cacheSegmentos = null;
async function carregarSegmentos() {
  try {
    const res = await fetch(`${API_BASE}/listar_segmentos.php`);
    const data = await res.json();
    cacheSegmentos = data.sucesso ? data.segmentos : [];
  } catch (e) {
    cacheSegmentos = [];
  }
  const sel = document.getElementById('fCategoria');
  cacheSegmentos.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.slug;
    opt.textContent = s.label;
    sel.appendChild(opt);
  });
}
function labelDoSegmento(slugSegmento) {
  if (!cacheSegmentos) return null;
  const achado = cacheSegmentos.find(s => s.slug === slugSegmento);
  return achado ? achado.label : null;
}

// --- Cidades por estado (IBGE), mesma técnica do site principal ---
const cacheCidadesPorUf = {};
async function carregarCidadesParaEstado(uf) {
  if (!uf || cacheCidadesPorUf[uf]) return;
  try {
    const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
    const cidades = await res.json();
    cacheCidadesPorUf[uf] = cidades.map(c => c.nome);
  } catch (e) {
    cacheCidadesPorUf[uf] = [];
  }
  const datalist = document.getElementById('listaCidadesBusca') || (() => {
    const dl = document.createElement('datalist');
    dl.id = 'listaCidadesBusca';
    document.body.appendChild(dl);
    return dl;
  })();
  datalist.innerHTML = cacheCidadesPorUf[uf].map(c => `<option value="${c}">`).join('');
  document.getElementById('fCidade').setAttribute('list', 'listaCidadesBusca');
}

// --- Geolocalização opcional (mesmo padrão do site principal: só ativa se a pessoa clicar) ---
document.getElementById('btnUsarLocalizacao').addEventListener('click', () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const { latitude, longitude } = pos.coords;
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`);
      const data = await res.json();
      const uf = data.principalSubdivisionCode ? data.principalSubdivisionCode.split('-')[1] : '';
      if (uf) {
        document.getElementById('fEstado').value = uf;
        await carregarCidadesParaEstado(uf);
      }
      if (data.city) document.getElementById('fCidade').value = data.city;
      executarBusca();
    } catch (e) {
      // silencioso: geolocalização é um atalho opcional, não uma obrigação
    }
  });
});

document.getElementById('fEstado').addEventListener('change', (e) => carregarCidadesParaEstado(e.target.value));

// --- Busca ao vivo (debounced) conforme qualquer filtro muda ---
const contagemEl = document.getElementById('contagem');
const resultadosEl = document.getElementById('resultados');
let timeoutBusca = null;

function agendarBusca() {
  clearTimeout(timeoutBusca);
  timeoutBusca = setTimeout(executarBusca, 300);
}

async function executarBusca() {
  const q = document.getElementById('fNome').value.trim();
  const categoria = document.getElementById('fCategoria').value;
  const estado = document.getElementById('fEstado').value;
  const cidade = document.getElementById('fCidade').value.trim();

  if (!q && !categoria && !estado && !cidade) {
    contagemEl.textContent = '';
    resultadosEl.innerHTML = `<div class="busca-vazio">use os filtros acima pra encontrar perfis</div>`;
    return;
  }

  contagemEl.textContent = 'buscando…';

  try {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (categoria) params.set('categoria', categoria);
    if (estado) params.set('estado', estado);
    if (cidade) params.set('cidade', cidade);

    const res = await fetch(`${API_BASE}/buscar_avancado.php?${params.toString()}`);
    const data = await res.json().catch(() => null);

    if (!res.ok || !data || !data.sucesso) {
      contagemEl.textContent = (data && data.erro) || 'erro ao buscar';
      resultadosEl.innerHTML = '';
      return;
    }

    if (!data.resultados.length) {
      contagemEl.textContent = '';
      resultadosEl.innerHTML = `<div class="busca-vazio">nenhum perfil encontrado com esses filtros</div>`;
      return;
    }

    contagemEl.textContent = `${data.resultados.length} resultado${data.resultados.length > 1 ? 's' : ''}`;
    resultadosEl.innerHTML = `<div class="busca-resultados-grid">${data.resultados.map(p => `
      <a href="/${p.slug}" class="busca-card">
        <span class="avatar">${p.foto_url ? `<img src="${p.foto_url}" alt="">` : iniciaisNome(p.titulo)}</span>
        <span class="info">
          <span class="nome">${p.titulo}${seloVerificado(p)}</span>
          <span class="meta">
            @${p.slug}${labelDoSegmento(p.categoria) ? ' · ' + labelDoSegmento(p.categoria) : ''}${p.cidade ? ' · ' + p.cidade + '-' + p.estado : ''}
          </span>
        </span>
      </a>
    `).join('')}</div>`;
  } catch (e) {
    contagemEl.textContent = 'erro de conexão com a api';
    resultadosEl.innerHTML = '';
  }
}

['fNome', 'fCidade'].forEach(id => {
  document.getElementById(id).addEventListener('input', agendarBusca);
});
['fCategoria', 'fEstado'].forEach(id => {
  document.getElementById(id).addEventListener('change', agendarBusca);
});

// --- Pré-preenche com o termo vindo da busca rápida (modal do index), se houver ---
(async () => {
  await carregarSegmentos();
  const params = new URLSearchParams(window.location.search);
  const qInicial = params.get('q');
  const categoriaInicial = params.get('categoria');
  const estadoInicial = params.get('estado');
  const cidadeInicial = params.get('cidade');
  let deveBuscar = false;

  if (qInicial) {
    document.getElementById('fNome').value = qInicial;
    deveBuscar = true;
  }
  if (categoriaInicial) {
    document.getElementById('fCategoria').value = categoriaInicial;
    deveBuscar = true;
  }
  if (estadoInicial) {
    document.getElementById('fEstado').value = estadoInicial;
    await carregarCidadesParaEstado(estadoInicial);
    deveBuscar = true;
  }
  if (cidadeInicial) {
    document.getElementById('fCidade').value = cidadeInicial;
    deveBuscar = true;
  }

  if (deveBuscar) {
    executarBusca();
  } else {
    resultadosEl.innerHTML = `<div class="busca-vazio">use os filtros acima pra encontrar perfis</div>`;
  }
})();
