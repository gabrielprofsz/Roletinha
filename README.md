
## 📁 Estrutura de arquivos

```
roletinha/
├── index.html              → estrutura das telas
├── style.css                → visual (cores, fontes, animações)
├── script.js                 → toda a lógica do app
├── data.js                   → catálogo de produtos (edite aqui pra adicionar/remover itens)
├── README.md                  → este arquivo
└── assets/
    ├── LEIA-ME.txt              → instruções da música
    ├── musica-sorteio.mp3        → (você adiciona) toca enquanto a roleta gira
    ├── musica-especial.mp3        → (você adiciona) toca no easter egg
    └── icons/
        ├── LEIA-ME.txt              → instruções dos ícones
        └── *.png                     → (você adiciona) ícones personalizados por categoria
```

**Tudo isso precisa estar dentro da mesma pasta**, mantendo essa estrutura — o app só funciona se `style.css`, `script.js`, `data.js` e a pasta `assets` estiverem ao lado do `index.html`.

---

## 🚀 Como publicar no GitHub Pages

1. Crie um repositório no GitHub (pode ser público) e suba todos os arquivos e pastas acima nele — mantendo a mesma estrutura.
2. No repositório, vá em **Settings** (barra de menus horizontal, no topo).
3. No menu lateral esquerdo, procure **Pages** (dentro de "Code and automation").
4. Em **Build and deployment → Branch**, escolha `main` (ou `master`) e a pasta `/ (root)`. Clique em **Save**.
5. Espere 1-2 minutos. A própria página do GitHub Pages vai mostrar o link:
   `https://seu-usuario.github.io/nome-do-repositorio/`
6. Abra esse link — é o app publicado, pronto pra usar.

**Importante:** abrir o `index.html` direto no navegador (duplo clique, sem publicar) faz o **áudio não funcionar**, porque o navegador bloqueia arquivos de som carregados assim (protocolo `file://`). Publicando no GitHub Pages (ou qualquer servidor `https://`), o áudio funciona normalmente.

### Atualizando o app depois de publicado

Sempre que eu (Claude) te mandar arquivos novos ou atualizados, é só substituir os arquivos correspondentes no repositório do GitHub (upload de novo, sobrescrevendo) — o link continua o mesmo, o site atualiza sozinho em 1-2 minutos.

---

## 🎵 Adicionando música

Veja `assets/LEIA-ME.txt` pra instruções completas. Resumo:

- Salve o arquivo de música que você escolher com o nome exato `musica-sorteio.mp3` (toca durante o giro) e/ou `musica-especial.mp3` (toca no easter egg).
- Coloque dentro da pasta `assets/`.
- Sem esses arquivos, o app funciona normal, só sem som — nenhum erro aparece.

**Erro comum:** o arquivo salvar como `musica-sorteio.mp3.mp3` (extensão duplicada, geralmente porque o sistema esconde a extensão real). Ative "mostrar extensões de arquivo" no seu computador antes de renomear, pra evitar isso.

---

## 🖼️ Personalizando os ícones

Veja `assets/icons/LEIA-ME.txt` pra instruções completas. Resumo: coloque imagens `.png` quadradas (~200x200px) com estes nomes exatos dentro de `assets/icons/`, e o app troca o emoji correspondente automaticamente:

| Arquivo | Onde aparece |
| --- | --- |
| `mao.png` | Card "mão" na tela inicial |
| `rosto.png` | Card "rosto" na tela inicial |
| `splash.png` | Card e roleta de Body Splash |
| `combo.png` | Card "combo do dia" |
| `boca.png` | Roleta e resultado de Boca |
| `olhos.png` | Roleta e resultado de Olhos |
| `esmalte.png` | Roleta e resultado de Esmalte |
| `esmalte_efeito.png` | Roleta e resultado de Esmalte Efeito |
| `blush.png` | Roleta e resultado de Blush |
| `anel.png` | Roleta e resultado de Anel |
| `base.png` | Roleta e resultado de Base/Corretivo |
| `cilios.png` | Roleta e resultado de Máscara de Cílios |

Isso personaliza o ícone de cada **categoria** — não é uma foto de cada um dos 313 produtos individualmente (isso é uma etapa futura maior, de cadastro com upload de foto por item).

---

## 🎯 Como o app funciona

### Navegação
- **Mão** → Anel, Esmalte, Esmalte Efeito
- **Rosto** → Boca, Olhos, Blush, Base/Corretivo, Máscara de Cílios
- **Body Splash** → roleta única, direto na home
- **Combo do dia** → sorteia as 8 categorias juntas de uma vez (esmalte + esmalte efeito contam como uma roda só)

### Catálogo atual (`data.js`)

| Categoria | Produtos |
| --- | --- |
| Boca | 82 |
| Body Splash | 25 |
| Olhos | 85 |
| Esmalte | 47 |
| Esmalte Efeito | 17 |
| Blush | 24 |
| Anel | 14 |
| Base/Corretivo | 12 |
| Máscara de Cílios | 7 |
| **Total** | **313** |

### Roleta vs. esteira de nomes
Roletas com **até 40 produtos** mostram uma roda giratória com o nome de cada item desenhado nela. Acima de 40, o app troca automaticamente para uma **esteira vertical de nomes** (estilo caça-níquel), porque não existe tamanho de fonte legível pra 80+ fatias numa roda. Isso é controlado por uma única constante no início do `script.js`:

```js
const REEL_THRESHOLD = 40;
```

Hoje isso afeta Boca (82), Olhos (85) e Esmalte (47). Pra mudar o comportamento, é só me pedir pra ajustar esse número.

### Filtro por marca
Roletas que têm produtos com marca identificada (a maioria) mostram um filtro por marca antes de girar, com contador de quantos produtos estão disponíveis. Roletas sem marca identificável nos nomes (como Esmalte e Anel, que são nomes de cor/estilo) não mostram esse filtro.

### Não repetir até resetar
Cada roleta lembra quais produtos já saíram nela. Um produto sorteado **some da roleta** até que:
- todos os produtos daquela roleta já tenham saído (aí ela recicla sozinha, automaticamente), ou
- você aperte o botão **"↺ resetar roleta"**, que aparece assim que o primeiro item sai.

Isso fica salvo no **`localStorage`** do navegador — ou seja, continua valendo mesmo fechando a aba ou desligando o celular, **mas só naquele navegador/aparelho específico**. Trocar de navegador, limpar dados do navegador, ou usar outro celular reinicia esse histórico (não existe sincronização em nuvem nessa versão).

### Clima do dia
A tela inicial tem um seletor de clima (aleatório / date / trabalho / em casa). Hoje os produtos não têm essa marcação individual (é um recurso pra usar no futuro, se quiser marcar produtos específicos pra ocasiões específicas).

### Easter egg
A cada 7 giros (contando todas as roletas juntas), em vez do resultado normal aparece uma mensagem/animação especial.

---

## ✏️ Editando o catálogo de produtos

Abra o `data.js`. Cada produto é um objeto assim:

```js
{ id: "boca_001", nome: "Guava Ginger", marca: "Guava", tipo: "labios",
  categoriaRoleta: "boca", cor: "", funcao: "", combina: "", climas: [], ativo: true },
```

- **nome**: aparece na roleta e no resultado.
- **marca**: usada no filtro por marca (deixe `""` se não tiver marca).
- **categoriaRoleta**: qual roleta esse item pertence (`boca`, `splash`, `olhos`, `esmalte`, `esmalte_efeito`, `blush`, `anel`, `base`, `cilios`).
- **funcao** / **combina**: se preenchidos, aparecem no resultado (ex: "combina com looks pretos"). Hoje estão em branco pra maioria — pode preencher aos poucos.
- **climas**: lista de climas que esse item combina (`"date"`, `"trabalho"`, `"casa"`). Deixe `[]` pra combinar com qualquer clima.
- **ativo**: `false` remove o item do sorteio sem apagar ele da lista.

Pra adicionar um produto novo, copie um objeto existente da mesma categoria, mude o `id` (não pode repetir) e os campos.

---

## 🔮 Próximos passos possíveis (ainda não implementados)

- Tela de cadastro visual (adicionar/editar/remover produtos sem mexer no código)
- Foto de cada produto individual
- Favoritos
- Histórico e estatísticas (produto/marca mais sorteado)
- Exportar/importar backup dos dados
- Transformar em PWA instalável no celular
- Sincronizar o "já sorteado" entre aparelhos diferentes (exigiria um backend)

---

Feito com carinho, roleta por roleta. 💛
