import { AppState } from '../store';

import sweetAlert1 from '../audio/sweet-alert-1.wav';
import sweetAlert2 from '../audio/sweet-alert-2.wav';
import sweetAlert3 from '../audio/sweet-alert-3.wav';
import sweetAlert4 from '../audio/sweet-alert-4.wav';
import sweetAlert5 from '../audio/sweet-alert-5.wav';
import glowa from '../audio/glowa.wav';
import trial from '../audio/trial.wav';
import { MessageBuilder, Webhook } from 'webhook-discord';
import { centsToGBP } from './centsToGBP';
import { studyImg } from './GlobalVars';
import { ProlificStudy } from '../types';
import { appendLog } from '../pages/background';

const packageJson = require("../../package.json")

function playFile(file: any, volume: number) {
  const audio = new Audio(file);
  audio.volume = volume / 100;
  audio.play();
}

export function playAlertSound(state: AppState) {
  switch (state.settings.alert_sound) {
    case 'none':
      break;
    case 'sweet-alert-1':
      playFile(sweetAlert1, state.settings.alert_volume);
      break;
    case 'sweet-alert-2':
      playFile(sweetAlert2, state.settings.alert_volume);
      break;
    case 'sweet-alert-3':
      playFile(sweetAlert3, state.settings.alert_volume);
      break;
    case 'sweet-alert-4':
      playFile(sweetAlert4, state.settings.alert_volume);
      break;
    case 'sweet-alert-5':
      playFile(sweetAlert5, state.settings.alert_volume);
      break;
    case 'glowa':
      playFile(glowa, state.settings.alert_volume);
      break;
    case 'trial':
      playFile(trial, state.settings.alert_volume);
      break;
    case 'voice':
      const speech = new SpeechSynthesisUtterance('New studies available on Prolific.');
      speech.volume = state.settings.alert_volume / 100;
      speechSynthesis.speak(speech);
      break;
  }
}

export function sendWebhook(state: AppState,study:ProlificStudy){
  if (study.id.includes('TEST'))return;

  const hookUrl = state.settings.webhook.url;
  let pings = "";
  const pingsRaw = state.settings.webhook.ping;
  pingsRaw.split(' ').forEach((el:any)=>{
    pings+=`<@${el.trim()}>`;
  })

  if(hookUrl.length<1){
    appendLog('Webhook is empty, ignoring it', 'status','');
    return
  }

  if(!state.settings.webhook.enabled)return;

  try{
    async function sendWebhookAsync(){
      const Hook = new Webhook(hookUrl);
      //Hook.info('', `${study.name}: https://app.prolific.co/studies/${study.id}`);
      const img = study.researcher.institution && study.researcher.institution.logo
        ? study.researcher.institution.logo
        : studyImg;

      const msg = new MessageBuilder()
        .setName("")
        .setColor("#007eff")
        .setTitle(`${study.name}`)
        .setURL(`https://app.prolific.co/studies/${study.id}`)
        .setDescription(`New studies available on Prolific`)
        .addField("Name",`${study.name}`)
        .addField("ID",`${study.id}`)
        .addField("URL",`[Click!](https://app.prolific.co/studies/${study.id})`)
        .addField(`Hosted by`,`${study.researcher.name}`)
        .addField(`Reward`,`${centsToGBP(study.reward)} - ${centsToGBP(study.average_reward_per_hour)}/h`)
        .addField(`Time`,`${study.estimated_completion_time}min - MAX: ${study.maximum_allowed_time}min`)
        .addField(`Places`,`${study.places_taken}/${study.total_available_places} - ${study.total_available_places-study.places_taken}`)
        .addField(``,`${pings}`)
        .setFooter(`Generated by Prolific Assistant ${packageJson.version}`,"")
        .setThumbnail(img)
      await Hook.send(msg);

      appendLog('Successfully sent to webhook', 'status', `Successfully sent webhook\nStudyID: ${study.id}`);
    }
    sendWebhookAsync();
  }catch(err) {
    appendLog('ERROR while sending to webhook', 'error', `ERROR while sending to webhook\nStudyID: ${study.id}\nERROR: ${JSON.stringify(err)}`);
  }
}
