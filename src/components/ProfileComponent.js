import React from 'react';
import clsx from 'clsx';

const ProfileConst = {
    name: 'Koichi Taura',
    description: '東京でソフトウェアエンジニアとして働いていて。 PHP, Java, Pythonでバックエンドの開発を行っています。 Docker/Kubernetesへの環境構築移行も行なっております。',
    image: 'https://avatars2.githubusercontent.com/u/5842679?s=460&amp;v=4'
}

export default function ProfileComponent() {
    return (
        <div id="profile" class="col-lg-8 col-md-10 mx-auto rounded profile-area ">
            <h2 class="contents-title">Profile</h2>
            <div class="float-left col-lg-8 col-md-7 profile-detail">
                <h3>{ProfileConst.name}</h3>
                <div>
                    {ProfileConst.description}
                </div>
            </div>
            <div class="float-right col-lg-4 col-md-5 mx-auto">
                <img src={ProfileConst.image} class="img-profile img-fluid img-thumbnail" />
            </div>
        </div>
    );
}