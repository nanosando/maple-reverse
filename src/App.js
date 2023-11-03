import './App.css';
import Play from './view/play/Play';
import PlayAI from './view/play/PlayAI';
import gLogo from './resource/github-mark.png';

import { useState } from 'react';
import { Layout, Menu } from 'antd';

const { Header, Footer } = Layout;

function App() {
  const [tab, setTab] = useState('play_ai');

  function onChangeTab(selected) {
    setTab(selected.key);
  }
  return (
    <Layout>
      <Header className="header">
        <a href="/">
          <div className="titleText"> 메이플 배틀리버스 </div>
        </a>
        <Menu theme="light" mode="horizontal" defaultSelectedKeys={['play_ai']} onClick={onChangeTab} disabledOverflow={true} className="tabs">
          {/* {<Menu.Item key='helper' className="menuItem"> AI 도우미 </Menu.Item>} */}
          <Menu.Item key='play_ai' className="menuItem"> AI와 대결 </Menu.Item>
          {/* {<Menu.Item key='play_multi' className="menuItem"> 친구와 대결 </Menu.Item>} */}
        </Menu>
      </Header>
      <div>
        {
          tab === 'helper'?
          <>
          </> :
          <>
          {
            tab === 'play_ai' ?
            <PlayAI /> : <Play />
          }
          </>
        }
      </div>
      <Footer className="footer">
        <a href="https://github.com/nanosando" target="_blank">
          <img src={gLogo} width='30px'></img>
        </a>
      </Footer>
    </Layout>
  );
}

export default App;
