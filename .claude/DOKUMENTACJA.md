# StreamGenius – Pełna Dokumentacja Funkcjonalna i Architektoniczna

Poniższa dokumentacja służy jako „jednopunktowe źródło prawdy” (Single Source of Truth) dla projektu StreamGenius. Opisuje, czym jest aplikacja, jak działają jej poszczególne elementy w najmniejszym detalu, jaki jest przepływ danych i stanów, oraz w jaki sposób zostanie zintegrowana z wymaganiami produkcyjnymi (Smelter oraz Fishjam).

Dokument jest na tyle obszerny, by na jego podstawie odtworzyć projekt lub wdrożyć nowych członków zespołu w dowolnym momencie.

---

## 1. Koncepcja i Opis Projektu

**StreamGenius** to wirtualny asystent (AI co-pilot) ułatwiający strumieniowanie i produkcję wideo w czasie rzeczywistym. 
Celem aplikacji jest zautomatyzowanie i uproszczenie pracy twórcy (stremera/podcastera), który prowadzi konwój na żywo – dzięki temu nie musi on przerywać audycji w poszukiwaniu materiałów graficznych ani weryfikować pojęć.

### 1.1 Jak to działa?
1. Mikrofon użytkownika rejestruje mowę nieprzerwanie, lokalnie zamieniając ją na odpowiedni format audio.
2. Strumień audio przesyłany jest do backendu, a stamtąd bezpośrednio do API AI (Gemini Live API).
3. Gdy asystent (Gemini) zidentyfikuje konkretną **intencję** (ang. _intent_), np. wspominanie o wideo z serwisu YouTube, wywołuje się określona w systemie funkcja po stronie serwera – tzw. **Tool Calling / Function Calling**.
4. W tle, serwer realizuje faktyczne zapytanie (np. do YouTube Data API) o metadane, przekazuje odpowiedź do Gemini oraz symultanicznie – załącza gotową „propozycję nakładki graficznej” (overlay proposal) do panelu sterującego twórcy (frontend).
5. Twórca po weryfikacji może zatwierdzić nakładkę jednym kliknięciem. Po jej zatwierdzeniu pojawia się ona na wyrenderowanym wideo i trafia do widzów.

### 1.2 Docelowe wykorzystanie
- Transmisje na żywo na popularnych platformach streamingowych.
- Eventy typu konferencje, gdzie prelegent często powołuje się na statystyki lub dane rynkowe.
- Automatyzacja tworzenia nakładek graficznych (tzw. "Lower Thirds") po post-produkcyjnej obróbce nagrań VOD.

---

## 2. Architektura Systemu

### 2.1 Architektura Aplikacji i Przepływ Danych
Architektura wdrożenia dzieli się na warstwy, łączące ze sobą front-end, centralny backend operacyjny i warstwę dostarczającą logikę AI, a na końcu przesyłającą wideo obrobione przez silnik kompozycyjny Smelter do globalnej sieci poprzez układ Fishjam (SFU).

1. **Warstwa Kliencka (Przeglądarka / React):**
   - **Rejestracja Audio:** Zapis mikrofonowy korzystający z *Web Audio API* oraz *AudioWorklet* transkodujący mowę na format RAW PCM wielkości 16 kHz i 16-bit, przesyłany częściami (chunks) Base64.
   - **Kompozycja Wideo (Smelter):** Przeglądarka bezpośrednio pobiera sygnał z kamery twórcy (*getUserMedia*). Ten sygnał natywnie ładowany jest do frameworka Smelter, która w oparciu o komponenty Reactowe rysuje nałożone na niego warstwy informacyjne. Plusem tej separacji jest fakt, iż kamera pod żadnym pozorem nie wędruje surowa przez zewnętrzne serwery, przed kompozycją na maszynie twórcy.
   - **Transmisja Rzeczywista (Fishjam):** Gotowy sygnał Smeltera emitowany jest klientem Fishjam poprzez WebRTC, bezpośrednio do serwera dostępowego, co finalnie trafia do widzów.
   - **Zarządzanie Stanem:** Globalny stan w obydwu modułach zarządzany za pomocą React `useReducer` lub biblioteki `Zustand` w oparciu o cykl życia nakładek (widoczny poniżej).

2. **Warstwa Serwerowa (Backend - Node.js):**
   - **WebSocket Orchestrator:** Punkt styku i autoryzacji komunikacji z klientem. Zarządza pojedynczym, stałym połączeniem.
   - **Proxy Logiki Gemini:** Skuteczne tunelowanie żądań audio od klienta przez proxy do Gemini Live. Musi być obsłużone jednym ciągiem, ponieważ odpowiedzi (narzędzia) na wywołane funkcje AI muszą powrócić do API na tej samej ciągłości sesji dla logiki LLM.
   - **Jednostce Pobrane (Fetchers - Asynchronicznie):**
     Słowniki zbierające informacje:
     - *Youtube API* -> miniatury, statystyki nagrań.
     - *Google Search* -> wyszukiwanie faktów i odnośników.
     - *Wiki API* -> weryfikacja.
     - *Gemini 3.1 Pro* -> model analityczny i logiczny z REST wykorzystywany do oceny i syntezy (na przykład ocena poprawności porównania po wyciągnięciu twardych cech po zapytaniach Search API).
   - **Warstwa Cache Zapasowego:** Zapobiega niedołężności API. Czyste rozgrzanie instancji przygotowanymi z góry odpowiedziami na moment 3 sekund przed timeoutem, wykorzystywane np. do celów "safe-fail demo" bez przerywania show.

---

## 3. Komunikacja Oparta na WebSocket (Kontrakt Aplikacji)

Aplikacja zależy od utrzymania pojedynczego połączenia WebSocket na osi *Przeglądarka* ↔ *Backend*. Wiadomości budowane są na kontraktach zapisanych w pakiecie wspólnym `@streamgenius/shared`, przesyłane w formacie JSON i wyróżnione specjalnym atrybutem sterującym z wymaganą zawartością obiektową:

### Komunikaty od Klienta do Serwera (Upload):
| Typ (`kind`)         | Reprezentacja Obiektowa       | Zastosowanie |
|----------------------|-------------------------------|--------------|
| `audio_chunk`        | `{ data: string }`            | Część sygnału audio hosta zakodowana w standardzie Base64 (co ~100ms) wymuszona jako PCM dla wejścia Gemini Live API |
| `overlay_approve`    | `{ id: string }`              | Zdarzenie wysyłane, gdy operator klika w zatwierdzenie nakładki (w celach logowania postępowań). |
| `overlay_dismiss`    | `{ id: string }`              | Operator oddala/odrzuca przygotowaną z góry przez asystenta grafię. |

### Komunikaty od Serwera do Klienta (Download):
| Typ (`kind`)         | Reprezentacja Obiektowa                | Zastosowanie |
|----------------------|----------------------------------------|--------------|
| `transcript`         | `{ text, isFinal, timestamp }`         | Real-time zapis mowy pobrany podczas obsługi połączenia do wyświetlenia widoku napisów w panelu kontrolnym stremera. |
| `overlay_proposal`   | `{ proposal: OverlayProposal }`        | Powiadomienie o zmianie statusu asystenta, nakazujące np. re-render w interfejsie informujących asystencie, pobieraniu zawartości bądź statusie gotowej nakładki do publikacji na wizję. |
| `session_status`     | `{ connected, sessionId, reconnecting}`| Globalny metadany z obsługi sesji między serwerem, a AI. Limit połączeń AI to około 10 minut ze względu na architekturę protokołu, stąd stany wznowień są tu krytyczne do ciągłej pracy asystenta na streamie. |

### Cykl Życia Narzędzia (Konwencja Fork)
Aplikacja z wdrożenia korzysta z inteligentnego równoległego przetwarzania zapytań:
1. LLM (Gemini Live API) wysłuchuje słów: _„Ustaw taką wielką ankietę między React oraz Vue!”_
2. LLM po otrzymaniu paczek audio zgłasza **Tool Call** (żądanie asynchroniczne od siebie) w stylu metody `create_comparison("React", "Vue")`.
3. Jednocześnie serwer (1) zgłasza w interfejsie Twórcy, że narzędzie ma stan `fetching` i (2) odpytuje analityczny model _Gemini Pro 3.1_ z zapytaniem o obiektywne porównanie.
4. Po odpowiedzi fetchera z serwisu Google, serwer zgłasza zamknięcie odpowiedzi dla narzędzia LLM'owi (zwraca JSON'a), by asystent mógł wiedzieć, powiedzmy, co odpowiedzieć na ewentualne zapytacie ("Udało się zebrać materiał") i (2) wysyła finalny status `ready` przeznaczony dla klienta, gdzie Twórca zezwala na nakładkę.
Trwa to raptem około 2-3 sekundy. Twórca kontynuuje mówienie.

---

## 4. Stany Nakładki w Paneru Sterowania Twórcy (Overlay Management)

Serwer nie przechowuje globalnego stanu w pamięci podręcznej – jest tzw. „rozsyłaczem obwinień i notyfikacji”, cały cykl operacyjny dla streamu obsługuje front-end w `store.ts` przy opiece o np. framework Zustand / React Context:

Stany wewnętrznej nakładki:
1. `fetching` - Półprodukt wyobrażenia asystenta, klient wie, że musi poinformować Twórcę iż asystent oddelegował zapytanie do serwisu.
2. `ready` - Nakładka gotowa do renderowania, posiada niezbędny typ ładunku asystent. Trafia z panelu dolnego do pola aktywnego ("Zarządzanie na widok").
3. `approved` - Stan wyselekcjonowanej przez klika decyzji "Tak, zatwierdzam na wideo".
4. `rendering` / `displayed` - Smelter w tle integruje na warstwie wideo pozycję Reacta. Widz ma pogląd przez Fishjam na obiekt widoczny na wizji przez wyznaczony czas (~25-30s autousunięcie nakładki).
5. `dismissed` / `skipped` - Twórca usunął ręcznie powiadomienie z opcji pokazywanych.

Przekazywany JSON definiuje to u klienta obiektowym stylem:
```typescript
type OverlayProposal = {
  id: string; // uuid v4 uniwersalny po stronie sesji
  type: "youtube_card" | "fact_banner" | "comparison" | "viewer_highlight";
  status: "fetching" | "ready" | "error";
  trigger: string;
  timestamp: number;
  data: YoutubeData | FactData | ComparisonData | ViewerData | null;
}
```

---

## 5. Przyszłościowa i Finalna Implementacja Systemu Modułowego (Hackathon/Prod)

Architektura ta zakłada, iż w perspektywie startów (np. produkcja po Hackathonie SWM/Gemini) system operuje w pełni poprawnym działaniu z usługami *Smelter* oraz *Fishjam*. Jak ma działać pełna implementacja tych jednostek?

### 5.1 Integracja Narzędzi Software Mansion - SMELTER (Video Compositor)
Aktualna implementacja pozwala na stosowanie elementu podglądu typu Mock - klasyczny `<video>` w CSSie absolutnym bez kompozycji wideo. Docelowo nakładka wyrenderuje się podczas obróbki przed publikacją, dając płynniejsze działanie i zero opóźnień asynchronicznych podczas zapisu, a także niezliczoną kustomizację wizualną bez ingerencji serwera streamingowego.

1. W pliku docelowym modułu klienta instaluje się bibliotekę `@smelter/react`. Nadrzędnym elementem wyświetlania podglądu głównej pętli widoku Reacta (`StreamPreview.tsx` w strukturze `packages/frontend/`) jest wektor zagnieżdżony elementu klas komponentów we frameworku Smelter np. `<Smelter.Compositor>`.
2. Do węzła głównego podawany jest źródłowy obrys mediów `getUserMedia` z aparatu/kamery klienta `navigator.mediaDevices`.
3. Pozostałe komponenty interfejsu klienta ("Panel kontrolny") pozostają widoczne na wierzchu w drzewie DOM, podczas gdy podgląd po stronie streamu nie ulega relatywnemu nakładaniu kodu frontendowego, tylko opiera się o pełną logikę grafiki opartej o interfejs webowy i render z obsługą w pełni sprzętową WebAssembly/WebGL wewnątrz pakietu `@streamgenius/overlays`. 
Tworzone komponenty np. na format YouTube Card (`YoutubeCardOverlay.tsx`) budowane są z wewn. stylem Inline (konieczne dla poprawności renderowania bez komplikacji w CSS / Smelter).

### 5.2 Integracja Narzędzi Software Mansion - FISHJAM (Stream Broadcaster/SFU)
Architektura w ostateczności przewiduje serwer do zarządzania publicznie rozgłosem (Broadcasting). Z uwagi, że Smelter zajmie się renderingiem obrobionego układu audio-wideo, jego wyjście potrzebujemy przepchnąć rurą WebRTC dalej by trafiła do setek/tysięcy osób – i tu za zadanie staje Fishjam na chmurze SWM.
1. Frontend łączy instancję klienta wyjścia ze zintegrowanego komponentu WebGL (Output Streamu dla gotowej wizji) wyjmując obiekt `MediaStream` ze stopionego i nałożonego layoutu z warstwami AI.
2. Interfejs SWM posiada pokoje z identyfikacją sesji (peer connection). Po uzyskaniu tokenu, dołączenie i zestawienie `addTrack(MediaStream)` w WebRTC i Fishjam na backendzie przekieruje wariant bezpośrednio od Smeltera do panelu użytkowników docelowych (Widzów powszechnie połączonych z transmisją).
3. Moduł Fishjam służy w tej aplikacji nie tylko transmisji – jest planowany do asystowania AI za sprawą skanera logów: serwer na API przechwytując wiadomości pokoju Fishjam zintegruje odnajdywanie popularnego komentarza poprzez wyłapanie zapytania kluczowego przez Gemini 3.1 Pro z dyskusji widzów jako zrzut do funkcji (tzw. narządzie Fetcher: `viewer.ts` lub _"Pin viewer comment"_). 

---

## 6. Szybkie Podsumowanie Środowiska do Odtworzenia
1. **Pakiety wewnętrzne:** 
   - `@streamgenius/shared`: Typy i walidacje trzymane tu używane są wszędzie dla integralności bez naruszania z zależności kontraktowych.
   - `@streamgenius/backend`: Node.js lub Python. Socketowy Hub. Fallback proxy logiki w sytuacjach niedostępności. Narzędzia integracyjne AI (LLM). Plikiem startowym powinno być zestawienie Websocketa.
   - `@streamgenius/frontend`: Strona Vite, React. `main.tsx` odpowiada jako layout do obsługi panelu menadżerskiego Twórcy.
   - `@streamgenius/overlays`: Renderowanie pakietu grafii dla Smeltera wykorzystującego CSS Inline w WebRTC.
2. **Konta API niezbędne dla autoryzacji platformy:**
   - **Google AI Studio (`GEMINI_API_KEY`)** do obsługi trybu Life/Voice via WebSocket z użyciem _Gemini 2.5 Flash_ oraz w analitycznym tle klasyczny REST wykorzystujący _Gemini 3.1 Pro_.
   - **Google Cloud Console (`YOUTUBE_API_KEY`)** dla dostępu do Google Data API v3 podczas nakładek typu "Zmień pogląd na wideo autora".
   - **Programable Search Engine / Google Custom Search (`GOOGLE_SEARCH_API_KEY` oraz identyfikator `GOOGLE_SEARCH_CX`)** dla weryfikacji faktów z baz statystycznych i Wikipedii za pośrednictwem silnika zapytań o informacje na życzenie.

Z opisanymi tu zasadami wymiany danych między frontendem, logiką w tle LLMa poprzez Fork fetching, oraz wdrożeniu Smelter z Fishjam projekt jest kompletny pod założenia produkcyjne i hackathonowe w architekturze ostatecznej.
