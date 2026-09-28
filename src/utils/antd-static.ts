import { message as staticMessage, Modal } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import type { HookAPI as ModalHookAPI } from 'antd/es/modal/useModal';

interface AntdAppApi {
  message: MessageInstance;
  modal: ModalHookAPI;
}

// antd-nin statik funksiyaları React kontekstindən kənarda render olunur: theme-i görmür və
// "Static function can not consume context" xəbərdarlığı verir. Ona görə çağırışlar ən son
// mount olmuş antd <App> kontekstinə yönləndirilir (səhifə daxilindəki App kökdəkini örtür).
const registeredApps: AntdAppApi[] = [];
// App hələ mount olmayıbsa (məs. testlərdə) statik funksiyalar işləyir. Statik Modal nəticəsində
// hook API-dəki `then` yoxdur; layihədə modal nəticəsi await edilmədiyi üçün fərq yoxdur.
const staticFallback: AntdAppApi = { message: staticMessage, modal: Modal as unknown as ModalHookAPI };

const currentApp = () => registeredApps[registeredApps.length - 1] ?? staticFallback;

export const registerAntdApp = (api: AntdAppApi) => {
  registeredApps.push(api);

  return () => {
    const index = registeredApps.lastIndexOf(api);
    if (index !== -1) registeredApps.splice(index, 1);
  };
};

const delegateTo = <T extends object>(pick: (api: AntdAppApi) => T): T =>
  new Proxy({} as T, {
    get: (_target, key) => Reflect.get(pick(currentApp()), key),
  });

export const message: MessageInstance = delegateTo((api) => api.message);
export const modal: ModalHookAPI = delegateTo((api) => api.modal);
